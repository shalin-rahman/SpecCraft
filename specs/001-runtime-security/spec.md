# Feature Specification: Secure the Local Reference Runtime

**Feature**: `001-runtime-security`

**Created**: 2026-09-26

**Status**: Complete

**Input**: Close the authentication, request-resource, and credential-disclosure issues found in the whole-implementation reviews. Preserve SpecCraft's local-first use and current route shapes.

## User Scenarios & Testing

### User Story 1 - Reject unverified identity tokens (Priority: P1)

An operator configures an identity provider and expects a request to be accepted only when the token was signed by a configured key and is intended for this service.

**Why this priority**: The current adapter can accept a token without checking its signature when only a JWKS URL is configured. That makes the identity boundary unsafe.

**Independent Test**: Submit valid, forged, expired, wrong-issuer, wrong-audience, and unsupported-algorithm tokens to the identity adapter. Only the valid configured token is accepted.

**Acceptance Scenarios**:

1. **Given** a token with a valid signature from a configured key and valid required claims, **When** it is verified, **Then** the service returns the expected principal.
2. **Given** an unsigned, forged, unsupported, expired, not-yet-valid, wrong-issuer, or wrong-audience token, **When** it is verified, **Then** verification fails before claims are trusted.
3. **Given** a provider configured for public keys, **When** the key set cannot be loaded or has no matching valid key, **Then** verification fails closed.

### User Story 2 - Keep local API work bounded (Priority: P1)

A local operator can use the reference API without allowing a caller to bypass authentication or consume unbounded memory with request bodies, rate-limit identities, or pending proposals.

**Why this priority**: The API currently buffers the full body before checking its size, uses a caller-controlled authorization header as the rate-limit key, and retains limiter keys and proposals without a cap.

**Independent Test**: Send oversized requests, vary authorization headers from one client, and exceed the pending-proposal limit. Observe bounded memory inputs, stable limiting, and clear HTTP errors.

**Acceptance Scenarios**:

1. **Given** the service has no configured bearer token, **When** a loopback client calls a protected route, **Then** local use remains available; a non-loopback client is rejected.
2. **Given** a configured bearer token, **When** a protected request supplies a different token, **Then** it is rejected using a comparison that does not depend on the first differing character.
3. **Given** a request body larger than the documented limit, **When** the service receives it, **Then** it stops buffering and returns HTTP 413.
4. **Given** one client changes authorization headers repeatedly, **When** it exceeds the request limit, **Then** it cannot obtain fresh rate-limit buckets by changing that header.
5. **Given** the in-memory proposal limit is reached, **When** another proposal is submitted, **Then** it is rejected with a documented response and existing pending proposals remain available.

### User Story 3 - Review findings without exposing the secret (Priority: P1)

A maintainer can inspect a security scan result and understand the finding without seeing the credential value copied into the result.

**Why this priority**: Returning a matched credential defeats secret scanning's protective purpose and can propagate the secret into logs or reports.

**Independent Test**: Scan text containing a synthetic credential and assert the result identifies the rule and context but contains none of the credential characters.

**Acceptance Scenarios**:

1. **Given** scanned text contains a credential pattern, **When** a finding is returned, **Then** the credential value is absent from every field in the result.
2. **Given** scanned text contains a non-secret security pattern, **When** a finding is returned, **Then** its rule, severity, summary, and source context remain useful.

### Edge Cases

- The configured request limit is exceeded by a chunk when no `Content-Length` header is present.
- A JWKS response contains no keys, duplicate key IDs, an incompatible key type, or an incompatible declared algorithm.
- A rate limiter has reached its bucket cap while old buckets are expired.
- A client closes the request while the body is being read.
- A scanned credential is shorter than the normal display context or appears more than once.

## Requirements

### Functional Requirements

- **FR-001**: The identity adapter MUST verify the token signature with a fixed, explicitly supported algorithm and a configured verification key before trusting claims.
- **FR-002**: The identity adapter MUST reject unsigned tokens, unknown algorithms, missing keys, bad signatures, expired tokens, tokens used before their validity time, and configured issuer or audience mismatches.
- **FR-003**: A JWKS-configured identity provider MUST use an HTTPS endpoint, select one compatible signing key by a unique key ID, cap the response at 256 KiB and the key set at 100 keys, and fail closed if retrieval or key selection fails.
- **FR-004**: When no platform token is configured, protected HTTP routes MUST be available only to loopback clients. When a token is configured, it MUST be checked without an ordinary early-exit string comparison.
- **FR-005**: The HTTP API MUST enforce the request-body byte limit while receiving data and return HTTP 413 for an oversized body.
- **FR-006**: The HTTP API MUST use a client address, not a caller-controlled credential string, as the rate-limit identity.
- **FR-007**: Rate-limit state MUST be capped at 10,000 buckets by default, pending proposal state MUST be capped at 1,000 records by default, and expired limiter entries MUST be reclaimable.
- **FR-008**: Security findings MUST NOT include matched credential text. Other finding metadata needed for review MUST remain available.
- **FR-009**: The API MUST preserve existing successful route payloads and status codes except for the new authentication, size, rate, and capacity failure cases defined here.

### Key Entities

- **Verified principal**: Claims returned only after signature and configured claim checks pass.
- **Rate-limit bucket**: A bounded counter associated with the request source for one time window.
- **Pending proposal**: A transient proposal retained by the local reference API up to its configured capacity.
- **Security finding**: A rule, severity, summary, and source context that never contains the matched credential value.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All tests containing unsigned, forged, unsupported-algorithm, wrong-key, expired, and mismatched-claim tokens are rejected; the configured valid token is accepted.
- **SC-002**: No request body larger than 1,000,000 bytes is accumulated in memory, including chunked requests without a declared length.
- **SC-003**: Changing the Authorization header does not reset a client's request quota, and expired limiter buckets can be reclaimed without exceeding the configured bucket cap.
- **SC-004**: At 1,000 pending proposals, the API returns an explicit failure and retains all proposals already accepted.
- **SC-005**: A result from any built-in secret-literal rule does not contain the credential matched in the scanned text.
- **SC-006**: The complete existing test suite and all new regression tests pass.

## Assumptions

- The HTTP service is a local reference implementation, not a production deployment. Without an explicit bearer token, loopback-only access is the safe default.
- HS256 is supported only with an explicitly configured shared secret. RS256 is supported through a trusted HTTPS JWKS endpoint. Other algorithms remain unsupported until separately specified and tested.
- JWKS retrieval is limited to 5 seconds and cached for 5 minutes; the endpoint is operator configuration, not token-controlled input.
- Proposal records remain transient in-memory reference data. Capacity rejection preserves existing records; durable storage and proposal lifecycle endpoints are outside this change.
- The existing default request-body limit remains 1,000,000 bytes, measured in bytes rather than JavaScript string characters.
