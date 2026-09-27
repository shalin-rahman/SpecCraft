# Feature Specification: Secure repository roots and identity setup

**Feature Branch**: `003-secure-scan-roots`
**Created**: 2026-09-26
**Status**: Complete

## User Scenarios & Testing

### User Story 1 - Keep scans inside the configured root (Priority: P1)

When an operator scopes the local API to a repository directory, a scan request must not escape that boundary through a symbolic link, junction, or other filesystem alias.

**Why this priority**: The path boundary protects repository contents from unintended exposure.

**Independent Test**: Configure a temporary allowed root, place a directory junction under it targeting a different temporary directory, and request a scan through the junction; the request is rejected before target contents are read.

**Acceptance Scenarios**:
1. **Given** a requested path whose canonical target remains beneath the canonical configured root, **When** scanned, **Then** the scan succeeds.
2. **Given** a requested symlink or junction beneath the configured root that targets outside it, **When** scanned, **Then** the API rejects the request.
3. **Given** a nonexistent or inaccessible requested root, **When** scanned, **Then** the request fails without reading any alternate path.

### User Story 2 - Fail closed on incomplete managed identity setup (Priority: P1)

When an application configures the managed identity verifier, it must provide issuer, audience, and exactly one verification source so token verification cannot silently accept claims without issuer/audience checks or ambiguity about the signing method.

**Why this priority**: Identity verification without configured claim boundaries can accept credentials from unintended issuers or audiences.

**Independent Test**: Construct the provider with missing claims or ambiguous key sources and verify setup is rejected; then validate a properly configured HS256 or HTTPS JWKS provider.

**Acceptance Scenarios**:
1. **Given** missing issuer or audience, **When** the provider is created, **Then** configuration is rejected.
2. **Given** neither or both JWKS URL and signing secret, **When** configured, **Then** setup is rejected.
3. **Given** exactly one valid verification source and issuer/audience, **When** configured, **Then** the provider can verify tokens under its existing algorithm and claim rules.

## Edge Cases

- Canonical paths may differ in case or separator form on Windows; containment must use canonical platform paths.
- A junction target can be on another drive; it must fail the same containment check.
- A symlink target that remains within the allowed tree can be accepted, provided the final canonical target remains inside.
- File-system resolution errors must fail closed.
- Configuration failure messages must not expose signing secrets or token material.

## Requirements

### Functional Requirements

- **FR-001**: The API MUST compare canonical configured and requested repository roots before scanning.
- **FR-002**: The scanner MUST use the canonical requested root after it passes containment validation.
- **FR-003**: Symlink or junction targets outside the canonical configured root MUST be rejected before repository contents are read.
- **FR-004**: Managed identity provider setup MUST require non-empty issuer and audience.
- **FR-005**: Managed identity provider setup MUST accept exactly one of HTTPS JWKS URL or shared signing secret.
- **FR-006**: Existing valid token verification and claim checks MUST remain unchanged.
- **FR-007**: Regression tests MUST cover linked-root escape and incomplete/ambiguous identity setup.

### Key Entities

- **Configured repository root**: Canonical filesystem directory the API is allowed to scan.
- **Requested repository root**: User-supplied directory, resolved to its final filesystem target before containment comparison.
- **Identity verifier configuration**: Issuer, audience, and exactly one key source used to validate tokens.

## Success Criteria

- **SC-001**: An outside-target symlink or junction is rejected by the API scan route before target file content is included in results.
- **SC-002**: An in-boundary canonical target remains scannable.
- **SC-003**: Every missing, absent, or ambiguous managed identity configuration fails during setup.
- **SC-004**: Existing valid HS256 and RS256/JWKS test cases continue to pass.
- **SC-005**: The complete `npm test` suite passes.

## Assumptions

- The configured root and requested root are expected to exist and be directories.
- Windows junctions and POSIX symbolic links are covered through Node's filesystem resolution primitives.
- The managed identity provider remains a local reference adapter; this change does not wire it into the HTTP server.
