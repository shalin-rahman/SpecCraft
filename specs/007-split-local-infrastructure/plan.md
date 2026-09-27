# Implementation Plan: Split local infrastructure adapters

**Branch**: `007-split-local-infrastructure` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

## Summary

Move implementation into focused files for local persistence, identity, secrets, in-memory adapters, and security review. Keep the existing `production-infrastructure.js` path as a compatibility barrel, with old class names exported as aliases.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+  
**Dependencies**: Node built-ins only  
**Compatibility**: Existing barrel and class imports remain available  
**Verification**: `npm test`, `git diff --check`

## Decisions

1. Extract durable audit, collaboration/project file stores, and the file queue into file-backed modules; keep the queue lock implementation independent from higher-level stores.
2. Extract token verification and authorization separately from secrets and security scanning.
3. Name memory-only adapters `InMemoryDatabaseAdapter` and `InMemoryRateLimiter`; name local verification/queue behavior `HmacIdentityVerifier`, `LocalIdentityProvider`, `LocalAuthorizationService`, and `FileOutbox`.
4. Export existing `Managed*` and other legacy names as aliases from the compatibility barrel. Do not claim the aliases represent managed services.
5. Extract only code with a clear ownership boundary. Keep `src/platform-http.js`, `src/provider-router.js`, and `src/audit-rate-limit.js` in their current modules.
6. Serialize `DurableAuditLog.append` through the local file lock and apply chain-owned fields after filtering caller input.

## Affected Files

- `src/production-infrastructure.js` (compatibility exports)
- New `src/file-job-queue.js`, `src/file-stores.js`, `src/local-identity.js`, `src/local-secrets.js`, `src/in-memory-database.js`, `src/in-memory-rate-limiter.js`, and `src/security-review.js`
- `test/production-infrastructure.test.js` and focused direct-import tests
- Concurrent/adversarial audit-chain regression coverage
- `docs/platform-specification.md`, `docs/production-readiness-specification.md`, `docs/user-guide.md`, `docs/security-review-runbook.md`, `docs/workspace-setup.md`

## Test Plan

- Verify new and legacy names resolve to the same constructors.
- Run focused tests for persistence, identity, in-memory boundaries, and redaction.
- Run the complete `npm test` suite and whitespace validation.
