# Tasks: Resolve local import identities

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Local import graph

- [x] T001 [P] [US1] Add two-directory, duplicate-import, and traversal regressions in `test/code-graph.test.js`.
- [x] T002 [US1] Scope relative module IDs by importer, retain module observations, add direct file edges, and merge repeated evidence in `src/code-graph.js`.

## Phase 2: Documentation and verification

- [x] T003 Update local import graph behavior in `docs/platform-specification.md` and `docs/semantic-graph-implementation-plan.md`.
- [x] T004 Run `npm test` and `git diff --check`; update `docs/workspace-setup.md` with actual test count.
- [x] T005 Review the changes against spec, plan, constitution, and tests; resolve remaining gaps.
