# Tasks: Secure the Local Reference Runtime

**Input**: Design documents in this feature directory

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api-errors.md`, and `quickstart.md`

**Tests**: Regression tests are required by the specification and are scheduled before the corresponding implementation.

## Phase 1: Setup

**Purpose**: Record the baseline before the bounded implementation begins.

- [x] T001 Record the 25-pass baseline and the forged-token acceptance in `specs/001-runtime-security/research.md`.

## Phase 2: User Story 1 - Reject unverified identity tokens (Priority: P1)

**Goal**: Accept only tokens with a valid signature and valid configured claims.

**Independent Test**: The identity adapter accepts a locally generated valid token and rejects forged, unsupported, and invalid-claim variants.

### Tests

- [x] T002 [P] [US1] Replace the forged-token expectation and add HS256/RS256 valid-signature, forged-signature, missing-key, `none`, unknown/duplicate-key, wrong-algorithm, expiry, issuer, audience, tenant, HTTPS-only JWKS, response-size, key-count, redirect, and retrieval-failure cases in `test/production-infrastructure.test.js`.

### Implementation

- [x] T003 [US1] Add exact algorithm/key-type checks, timing-safe HS256 verification, `exp`/`nbf`/issuer/audience validation, and safe principal construction in `src/production-infrastructure.js` after T002 fails.
- [x] T004 [US1] Add bounded, timed, redirect-free HTTPS JWKS loading and RS256 `kid`/metadata key selection in `src/production-infrastructure.js`; keep `ManagedIdentityProvider.verifyToken` asynchronous and update its consumers in `test/production-infrastructure.test.js`.

## Phase 3: User Story 2 - Keep local API work bounded (Priority: P1)

**Goal**: Bound incoming bodies and process-local API state while keeping the loopback experience and successful response payloads intact.

**Independent Test**: HTTP tests cover local and configured-token access, a streaming body over the cap, stable rate-limit identity, and proposal-capacity rejection without loss of earlier proposals.

### Tests

- [x] T005 [P] [US2] Add HTTP regression cases for loopback access without a token, configured-token success/failure, the `isLoopbackAddress` boundary, a chunked body above the byte cap, changing Authorization headers, and proposal capacity in `test/platform-http.test.js`.
- [x] T006 [P] [US2] Add rate-limit tests for expired-key cleanup, bounded bucket count, and refusal to grow beyond capacity in `test/provider.test.js`.

### Implementation

- [x] T007 [US2] Stream-count request bytes, return 413 on overflow, limit pending proposals, and restrict unauthenticated access to loopback peers in `src/platform-http.js` after T005 fails.
- [x] T008 [US2] Key API limits on peer address and compare configured bearer tokens safely in `src/platform-http.js` after T005 fails.
- [x] T009 [US2] Add an explicit bucket cap, expired-entry reclamation, and capacity validation in `src/audit-rate-limit.js` after T006 fails.

## Phase 4: User Story 3 - Review findings without exposing the secret (Priority: P1)

**Goal**: Keep actionable rule metadata while removing matched credential text from scanner results.

**Independent Test**: Scan synthetic credential text and recursively assert that no result field contains the credential value.

### Tests

- [x] T010 [US3] Add a regression test that confirms secret matches never appear in `SecurityReviewRunner` output in `test/production-infrastructure.test.js` after T002 is complete.

### Implementation

- [x] T011 [US3] Remove matched text from built-in and custom security finding output while retaining safe metadata in `src/production-infrastructure.js` after T010 fails.

## Phase 5: Documentation and verification

**Purpose**: Align current behavior and provide a reviewable result.

- [x] T012 Update authentication, body-size, limiter, proposal, and production-boundary notes in `docs/platform-specification.md`, `docs/threat-model.md`, `docs/security-review-runbook.md`, `docs/workspace-setup.md`, `docs/user-guide.md`, `docs/production-readiness-specification.md`, `docs/production-delivery-backlog.md`, `docs/semantic-graph-implementation-plan.md`, and `README.md` after T003-T011.
- [x] T013 Run `npm test`, review `git diff --check`, and confirm every task and success criterion in `specs/001-runtime-security/` after T012.

## Dependencies & Execution Order

- Baseline T001 is complete before the user-story work.
- T002 precedes T003 and T004. T004 follows T003 because key retrieval uses the verified-token boundary.
- T005 and T006 precede their respective API and limiter changes. T007/T008 share `src/platform-http.js` and must be implemented sequentially.
- T010 precedes T011. Its file shares identity tests in `test/production-infrastructure.test.js`, so serialize edits to that file with T002.
- T012 follows all implementation tasks; T013 is the completion gate.

## Implementation Notes

- Do not add a JWT dependency for this reference adapter; use the supported Node.js crypto APIs and local generated test keys.
- Do not alter successful route response bodies.
- Do not evict already accepted pending proposals when capacity is reached.
- Keep identity-provider verification errors free of token, key, and claim values.
- Mark tasks complete only after their changes and focused checks are done.
