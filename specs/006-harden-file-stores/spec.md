# Feature Specification: Harden file-backed store writes

**Feature Branch**: `006-harden-file-stores`  
**Created**: 2026-09-27  
**Status**: In progress

## User Scenarios & Testing

### User Story 1 - Recover queue operations after an interrupted lock write (Priority: P1)

When a process stops while creating a queue lock, the next queue caller can recover the abandoned lock after the configured stale interval and continue processing.

**Independent Test**: Create an empty or malformed lock with an old timestamp and verify a queue mutation succeeds and removes the abandoned lock.

### User Story 2 - Safely update local collaboration and project files (Priority: P1)

When local callers update collaboration proposals or project state concurrently, writes use private temporary files and serialized read-modify-write operations so changes are neither redirected through a predictable temp path nor lost.

**Independent Test**: Pre-create the former predictable temporary path and race independent updates through separate store instances; verify the path is untouched and all valid updates remain.

## Requirements

- **FR-001**: Queue recovery MUST treat an unchanged malformed lock older than the configured stale interval as abandoned, while preserving the existing protection for live owners and changed locks.
- **FR-002**: File-backed store persistence MUST use unique temporary names created exclusively and atomically replace the destination only after a complete write.
- **FR-003**: Collaboration proposal updates MUST serialize revision checks and persistence across store instances sharing a path.
- **FR-004**: ProjectRepository read-modify-write operations MUST serialize across instances sharing a path.
- **FR-005**: A failed write MUST clean up its temporary file and release its lock.
- **FR-006**: The stores remain local-filesystem adapters; no network filesystem or distributed coordination guarantee is introduced.

## Edge Cases

- A crash leaves an empty, truncated, or invalid JSON lock file.
- A lock file changes between stale-owner inspection and recovery.
- The prior predictable `.tmp` path already exists or is a link.
- A write fails before atomic replacement.
- Two instances propose using the same expected revision, or mutate different project records concurrently.

## Success Criteria

- **SC-001**: An unchanged malformed stale queue lock is recovered and later mutations succeed.
- **SC-002**: Collaboration proposals with one expected revision produce one success and one revision conflict under concurrent calls.
- **SC-003**: Concurrent independent project updates are both persisted.
- **SC-004**: A pre-existing predictable temp path is never opened, truncated, or replaced by a store write.
- **SC-005**: `npm test` passes.

## Assumptions

- Local filesystems support exclusive file creation and atomic rename within a directory.
- Locking coordinates cooperating SpecCraft instances; arbitrary external writers are unsupported.
