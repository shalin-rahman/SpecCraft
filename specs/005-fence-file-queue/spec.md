# Feature Specification: Fence file-backed queue work

**Feature Branch**: `005-fence-file-queue`
**Created**: 2026-09-26
**Status**: Complete

## User Scenarios & Testing

### User Story 1 - Claim a job once across local workers (Priority: P1)

When multiple workers use the same file-backed queue, only one can claim a queued job at a time and concurrent state changes must not overwrite each other.

**Independent Test**: Use two queue instances on one file and race their claim calls; exactly one receives the job.

**Acceptance Scenarios**:
1. **Given** one queued job and concurrent claims, **When** both operations complete, **Then** one worker owns the running job and the other receives no job.
2. **Given** independent updates to different jobs, **When** they run concurrently, **Then** both updates remain in the persisted queue.

### User Story 2 - Reject work from expired leases (Priority: P1)

When a worker's lease expires and another worker reclaims a job, late completion or failure from the old worker must not change the new lease's state.

**Independent Test**: Claim, expire, and reclaim a job; submit the old lease's completion and failure and verify they are rejected while the new lease remains valid.

**Acceptance Scenarios**:
1. **Given** an expired lease reclaimed by another worker, **When** the former worker completes or fails it, **Then** the queue rejects the stale update.
2. **Given** the current lease token, **When** that worker completes or fails, **Then** the update succeeds.

### User Story 3 - Keep queue tests self-cleaning (Priority: P2)

When the queue tests run, all generated queue and lock files are removed with their isolated temporary directory.

**Independent Test**: Run the queue test and verify it creates files only beneath a temporary test directory that is removed in `finally`.

## Edge Cases

- A worker process exits while holding a lock; a later caller must recover after a bounded stale-lock threshold.
- A failed write must remove its unique temporary file and release its lock.
- Repeated idempotency keys return the existing job without adding records.
- Invalid or stale lease tokens cannot change job state.

## Requirements

### Functional Requirements

- **FR-001**: Queue read-modify-write operations MUST be serialized across queue instances using the same local queue file.
- **FR-002**: Queue persistence MUST use unique temporary filenames and atomic replacement so concurrent writers cannot share a temp path.
- **FR-003**: Every claim MUST receive a unique lease token.
- **FR-004**: Completion and failure MUST require the currently active lease token and reject stale workers.
- **FR-005**: Outbox draining MUST claim jobs through the queue and submit the active lease token on completion/failure.
- **FR-006**: Queue tests MUST place all generated files inside a temporary directory removed after the test.
- **FR-007**: Queue behavior MUST remain local-filesystem-only; no distributed-filesystem guarantee is claimed.

### Key Entities

- **Queue job**: Durable job state with status, attempts, and a current lease token.
- **Lease**: Unique token identifying the current worker claim for a running job.
- **Queue lock**: Short-lived local filesystem lock protecting one read-modify-write transaction.

## Success Criteria

- **SC-001**: Concurrent claims across two queue instances never return the same job.
- **SC-002**: Concurrent mutations of separate jobs are both retained.
- **SC-003**: Stale lease completion and failure are rejected after a later claim.
- **SC-004**: Test-generated queue artifacts are removed on success and failure.
- **SC-005**: The full `npm test` suite passes.

## Assumptions

- The queue file is on a local filesystem that supports exclusive file creation and atomic rename.
- Locks protect cooperating SpecCraft queue instances; external writers that bypass this protocol are unsupported.
- A lock older than the bounded recovery threshold is treated as abandoned.
