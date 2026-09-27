# Tasks: Fence file-backed queue work

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Concurrency and fencing

- [x] T001 [P] [US1] Add concurrent claim/mutation and stale lease regressions in `test/production-infrastructure.test.js`.
- [x] T002 [US1] Serialize queue mutations, use unique temp files, and recover bounded abandoned locks without stealing live locks in `src/production-infrastructure.js`.
- [x] T003 [US2] Add active lease tokens and reject stale completion/failure in `src/production-infrastructure.js`.
- [x] T004 [US2] Change outbox draining to claim jobs and pass current lease tokens in `src/production-infrastructure.js`.

## Phase 2: Test cleanup and verification

- [x] T005 [US3] Put the queue fixture under an isolated temporary directory and remove it in `finally` in `test/production-infrastructure.test.js`.
- [x] T006 Update local queue guarantees and production boundary in `docs/platform-specification.md`, `docs/production-readiness-specification.md`, and `docs/workspace-setup.md`.
- [x] T007 Run `npm test` and `git diff --check`; record current results in `docs/workspace-setup.md`.
- [x] T008 Review implementation against spec, plan, constitution, and tests; resolve remaining gaps.
