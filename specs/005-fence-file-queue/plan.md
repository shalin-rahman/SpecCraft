# Implementation Plan: Fence file-backed queue work

**Branch**: `005-fence-file-queue` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

## Summary

Protect each queue mutation with an exclusive sibling lock file, persist through unique temp files and atomic rename, and require a per-claim lease token for completion/failure. Update outbox draining to claim before invoking handlers and clean its temporary test files.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+
**Primary Dependencies**: Node built-ins
**Storage**: Local JSONL queue file and short-lived lock/temp files
**Testing**: `npm test`
**Project Type**: Local adapter/library
**Constraints**: Cooperating local filesystem clients only; no distributed lock or network filesystem guarantee.

## Constitution Check

- Brownfield compatibility: preserve enqueue/idempotency/status behaviors; lease tokens intentionally fence completion/failure.
- Verified behavior: add concurrency and stale-lease tests before changes.
- Security and reliability: no shared temp path; clean lock/temp files in `finally`.
- Truthful scope: describe this as local file coordination, not a managed distributed queue.

## Decisions

1. Acquire `<queue>.lock` using exclusive file creation. Retry briefly while another writer owns it; reclaim only locks older than a fixed 30-second threshold whose recorded process is gone. Serialize stale-lock recovery with a separate exclusive reaper marker and bound acquisition to 60 seconds. An abandoned reaper marker fails closed at timeout for manual recovery.
2. Perform the full list/mutate/persist sequence while holding the lock. Readers may remain lock-free because writers replace the queue atomically.
3. Persist to `<queue>.<pid>.<uuid>.tmp`; remove a leftover temp file in `finally` if writing or rename fails.
4. Assign every claim a random lease token. `complete` and `fail` require a matching active token; reclaimed jobs receive a new token. Clear the token when the job leaves the running state.
5. Have `ManagedOutbox.drain` claim work through the queue, pass the token to state updates, and process only the initial count of runnable records per drain.

## Test Plan

- Race claims through two queue instances and verify each job can be owned by at most one worker.
- Expire/reclaim a lease and verify old completion/failure are rejected while the new token succeeds.
- Exercise outbox drain with claim fencing.
- Put the existing queue fixture under `mkdtemp` and remove it in `finally`.
- Run the complete `npm test` suite and `git diff --check`.

## Project Structure

```text
src/production-infrastructure.js
test/production-infrastructure.test.js
docs/platform-specification.md
docs/production-readiness-specification.md
docs/workspace-setup.md
```

**Structure Decision**: Keep the adapter local and isolated in its current module.
