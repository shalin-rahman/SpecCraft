# Tasks: Split local infrastructure adapters

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Specify, plan, and analyze

- [x] T001 Define module boundaries, compatibility requirements, and honest adapter naming in `spec.md` and `plan.md`.
- [x] T002 Check current exports and consumers; retain `production-infrastructure.js` as a re-export barrel and avoid moving HTTP/provider modules.

## Phase 2: Extract by boundary

- [x] T003 Extract the file queue and file-backed stores into focused modules without changing behavior.
- [x] T004 Extract identity/authorization and secret providers into focused modules; add descriptive names and aliases.
- [x] T005 Extract in-memory database/rate-limit adapters and security scanning into focused modules; add compatibility aliases.
- [x] T006 Update tests to cover direct module imports and legacy alias identity.
- [x] T007 Update docs to use precise local/in-memory naming and describe the compatibility entry point.
- [x] T008 Run `npm test` (44 passed), inspect exports and module dependencies, and converge the task list.
- [ ] T009 Serialize audit appends and protect chain-owned fields; test concurrent writes and caller-supplied sequence/hash metadata.
