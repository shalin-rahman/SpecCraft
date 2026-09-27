# Tasks: Harden file-backed store writes

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Specify and verify the recovery boundary

- [x] T001 Define stale malformed lock, atomic temp-file, and serialized store mutation requirements in `spec.md` and `plan.md`.
- [x] T002 Analyze the findings against the feature artifacts and existing store contracts; no contradictions found.

## Phase 2: Implement and verify

- [x] T003 Recover unchanged malformed stale queue locks and add regression coverage in `src/production-infrastructure.js` and `test/production-infrastructure.test.js`.
- [x] T004 Use exclusive unique atomic temp files and serialize collaboration and project read-modify-write operations in `src/production-infrastructure.js`.
- [x] T005 Add predictable-temp-path and concurrent-update regressions in `test/production-infrastructure.test.js`.
- [x] T006 Update local persistence guarantees in the relevant platform and setup documentation.
- [x] T007 Run `npm test`, review the diff, and converge this task list.
