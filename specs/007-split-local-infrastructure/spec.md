# Feature Specification: Split local infrastructure adapters

**Feature Branch**: `007-split-local-infrastructure`  
**Created**: 2026-09-27  
**Status**: In progress

## User Scenarios & Testing

### User Story 1 - Find infrastructure behavior by its boundary (Priority: P1)

When a maintainer works on local persistence, identity, secrets, rate limiting, or security review, that behavior is defined in a focused module with only the dependencies it needs.

**Independent Test**: Import each boundary module directly and run its focused tests; confirm the compatibility entry point continues to expose existing imports.

### User Story 2 - Tell local examples from managed services (Priority: P1)

When a developer chooses an adapter, its name and documentation make clear whether it uses in-memory state, local files, or an external provider.

**Independent Test**: Instantiate the descriptive adapter names and verify old names remain available as aliases with equivalent behavior.

### User Story 3 - Keep the local audit chain ordered (Priority: P1)

When concurrent callers append audit records, each record follows the previous one and callers cannot replace the sequence, predecessor hash, or record hash.

**Independent Test**: Append concurrently through separate log instances, verify the chain, then try to supply chain-owned fields and verify the stored record remains valid.

## Requirements

- **FR-001**: Audit, file persistence/queue, identity/authorization, secrets, in-memory database/rate limiting, and security review code MUST live in focused boundary modules.
- **FR-002**: `src/production-infrastructure.js` MUST remain a compatibility entry point that re-exports the existing public symbols.
- **FR-003**: Adapters currently named `Managed*` that only use local files, in-memory state, or local verification MUST have descriptive replacement names.
- **FR-004**: Existing `Managed*` imports MUST remain supported as aliases with no behavior change.
- **FR-005**: Tests and user-facing docs MUST show the local/in-memory boundary and must not imply production infrastructure is deployed.
- **FR-006**: The extraction MUST preserve runtime behavior and require no new package dependency.
- **FR-007**: File-backed audit append operations MUST serialize sequence/hash-chain updates, and caller data MUST NOT override sequence, predecessor hash, or record hash.

## Edge Cases

- Existing consumers import the compatibility module or a legacy class name.
- A new module imports another boundary and creates a circular dependency.
- One source file is imported both directly and through the compatibility entry point.

## Success Criteria

- **SC-001**: The former infrastructure monolith contains only compatibility re-exports.
- **SC-002**: Every extracted boundary can be imported directly.
- **SC-003**: Legacy names and descriptive names resolve to the same constructors.
- **SC-004**: The full test suite passes without changing observable adapter behavior.
- **SC-005**: Documentation identifies local and in-memory adapters accurately.
- **SC-006**: Concurrent and adversarial audit appends leave a valid, sequential hash chain.

## Assumptions

- The current runtime is a local reference implementation; this work does not add deployed infrastructure.
- Public import compatibility is more valuable than removing old names immediately.
