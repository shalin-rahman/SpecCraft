# Implementation Plan: Secure the Local Reference Runtime

**Feature**: `001-runtime-security` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: [Feature specification](spec.md)

## Summary

Close the reviewed token-verification and resource-control gaps without replacing the local reference adapters. Keep the existing route payloads, require real signatures for identity tokens, bound request and in-memory work, and remove credential values from scan findings. The design reuses Node's built-in crypto and HTTP APIs; it adds no dependency.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+

**Primary Dependencies**: Existing `@babel/parser`; Node built-ins for crypto, HTTP, and tests

**Storage**: In-memory API proposals and rate-limit buckets; no durable persistence is added

**Testing**: `node:test` through `npm test`

**Target Platform**: Local Node.js service, with current default bind address `127.0.0.1`

**Project Type**: Node.js local HTTP service and library

**Performance Goals**: Request payloads are capped at 1,000,000 bytes; rate-limit storage is capped at 10,000 active buckets by default.

**Constraints**: No new packages; preserve local loopback use and successful API response shapes; identity checks must fail closed when verification material is missing.

**Scale/Scope**: The existing local reference runtime and its tests. This does not make its in-memory proposal or limiter adapters production infrastructure.

## Constitution Check

- **Evidence first**: Findings are tied to `src/production-infrastructure.js`, `src/platform-http.js`, `src/audit-rate-limit.js`, and their tests.
- **Human authority**: No scanned repository content is promoted or interpreted as authoritative knowledge by this work.
- **Specify before implementation**: This spec, plan, tasks, and analysis precede behavior changes.
- **Preserve the brownfield system**: Route success contracts and local loopback use remain intact. The identity verification method for JWKS-backed providers becomes asynchronous because key retrieval is network I/O; this adapter has no runtime consumers in `src/`.
- **Verify and document**: Add regression tests, run the full suite, and update the API/security docs.

**Gate**: Pass. The async JWKS method is the only compatibility change; current repository callers are tests, which will be updated. A separate production API migration is not implied.

## Research and Design

See [research.md](research.md) for the implementation evidence and external guidance. See [data-model.md](data-model.md), [contracts/api-errors.md](contracts/api-errors.md), and [quickstart.md](quickstart.md) for the relevant state, response, and verification details.

### Implementation boundaries

- `ManagedIdentityService` verifies explicitly configured HS256 tokens with a shared secret.
- `ManagedIdentityProvider` verifies HS256 or RS256 tokens; RS256 keys come from the configured HTTPS JWKS URL, selected by `kid`, `kty`, and optional JWK `alg`/`use`/`key_ops` metadata.
- Signature and time/issuer/audience checks happen before a principal is returned. Unsupported algorithms are rejected; the token header never chooses an arbitrary crypto operation.
- The JWKS fetch is injectable for tests, uses a 5-second timeout, rejects redirects, caps the response at 256 KiB and the key set at 100 keys, and caches it for 5 minutes.
- The local HTTP API keeps success response JSON unchanged. A small exported `isLoopbackAddress` helper makes the loopback boundary directly testable; the server admits loopback requests without a configured token and requires a valid bearer token from other peers.
- HTTP body collection counts bytes and discards data past the limit rather than retaining it. The error response remains the current `{ "error": ... }` shape.
- Rate limits are keyed by peer address, not the Authorization header. Expired buckets are reclaimed, and the bucket map cannot grow past its configured cap.
- Proposal capacity defaults to 1,000 records and is checked before append, so a rejected proposal cannot evict accepted pending work.
- Security scan findings retain rule metadata and source context but omit matched text.

## Project Structure

```text
.agents/skills/speckit-*/             # Installed Spec Kit workflow skills
.specify/                              # Spec Kit templates, scripts, constitution, integration
specs/001-runtime-security/            # This feature's specification and design artifacts
src/production-infrastructure.js       # Identity verification and safe security findings
src/platform-http.js                   # Request limits, authentication, limiter identity, proposal capacity
src/audit-rate-limit.js                # Bounded, reclaimable local limiter buckets
test/production-infrastructure.test.js # Token and finding-redaction regressions
test/provider.test.js                  # Rate limiter capacity and expiry regressions
test/platform-http.test.js             # HTTP authentication, payload, and proposal-capacity regressions
docs/                                  # Security, API, and setup behavior updated after implementation
```

## Complexity Tracking

No new architectural layer or dependency is justified. JWKS retrieval stays inside the existing identity adapter for this bounded fix; extracting a general identity package is deferred until a second implementation needs it.
