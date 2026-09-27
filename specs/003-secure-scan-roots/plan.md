# Implementation Plan: Secure repository roots and identity setup

**Branch**: `003-secure-scan-roots` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

## Summary

Close two security-review gaps: canonicalize requested/configured scan roots before containment checks, and reject managed identity verifier configurations that lack issuer/audience or combine/omit verification sources.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+
**Primary Dependencies**: Node built-ins only
**Storage**: Local filesystem; environment-provided identity configuration
**Testing**: `npm test` with Node test runner
**Target Platform**: Windows and POSIX Node.js platforms
**Project Type**: Local-first library and HTTP reference service
**Constraints**: Preserve same-root and in-scope scans; never expose secrets; do not connect identity to the HTTP auth path.

## Constitution Check

- Evidence and trust boundaries: pass; filesystem targets are canonicalized and identity configuration fails closed.
- Brownfield compatibility: pass; valid configured scans and valid provider algorithms retain behavior.
- Verification: pass; regression tests precede changes, followed by full `npm test`.
- Security boundary: pass; repository contents remain untrusted and are not executed.

## Decisions

1. Use `realpath` on both configured and requested roots before calling the existing lexical containment check. Return the canonical requested path so the scanner sees the same target that passed authorization. Errors from canonicalization propagate to the API's existing client-error handler.
2. Validate `ManagedIdentityProvider` in its constructor so invalid configuration cannot exist in a usable verifier instance. Require non-empty issuer/audience and exactly one of HTTPS JWKS URL or signing secret. Keep `ManagedIdentityService` local HS256 contract unchanged.
3. Test a Windows junction using Node's `symlink(..., "junction")`; skip only when the OS/filesystem cannot create a junction, and retain portable in-boundary tests.

## Test Plan

- HTTP regression: external junction below configured root is rejected, while canonical in-root requests still pass.
- Provider configuration: missing issuer/audience, zero sources, and both sources fail; existing valid HS256 and RS256/JWKS tests pass.
- Run full `npm test` and `git diff --check`.

## Project Structure

```text
src/platform-http.js
src/production-infrastructure.js
test/platform-http.test.js
test/production-infrastructure.test.js
docs/platform-specification.md
docs/workspace-setup.md
```

**Structure Decision**: Keep the existing API boundary and local adapter layout.
