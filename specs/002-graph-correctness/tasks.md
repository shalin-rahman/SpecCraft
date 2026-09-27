# Tasks: Correct graph and project observations

**Input**: [spec.md](spec.md), [plan.md](plan.md)  
**Tests**: Required for each behavior change; full `npm test` required at completion.

## Phase 1: Project graph correctness

- [x] T001 [P] [US1] Add regression tests retaining API contracts, permissions, and decisions in `test/spec-model.test.js`.
- [x] T002 [P] [US1] Add regression tests for inferred endpoint nodes, normalized trace metadata, explicit stale freshness, unsupported relationships, and duplicate links in `test/spec-model.test.js`.
- [x] T003 [US1] Normalize project trace graphs through the knowledge graph contract and preserve supported collections in `src/spec-model.js`.

## Phase 2: Deterministic repository observations

- [x] T004 [P] [US2] Add a temporary-repository test for deterministic scan ordering and cap selection in `test/repository-platform.test.js`.
- [x] T005 [US2] Sort repository entries before descent and cap enforcement in `src/repository-platform.js`.
- [x] T006 [P] [US2] Add code graph tests for exact, extensionless, and index relative imports plus package/unresolved imports in `test/code-graph.test.js`.
- [x] T007 [US2] Resolve relative imports only against scanned paths while retaining stable module node IDs in `src/code-graph.js`.
- [x] T008 [P] [US3] Add repeated-name and deterministic-ID Python tests in `test/parser-adapter.test.js`.
- [x] T009 [US3] Qualify Python lexical declaration IDs with source line in `src/parser-adapter.js`.

## Phase 3: Bounded traversal refactor

- [x] T010 [P] [US1] Add traversal tests for stable BFS ordering, incoming/outgoing/both direction, cycles, depth and node limits, and freshness/evidence propagation in `test/knowledge-graph.test.js`.
- [x] T011 [US1] Build sorted adjacency indexes once and replace front-shifting queue traversal while preserving observable behavior in `src/knowledge-graph.js`.

## Phase 4: Documentation and verification

- [x] T012 Update current behavior and limitations in `docs/platform-specification.md`, `docs/semantic-graph-specification.md`, and `docs/semantic-graph-implementation-plan.md`.
- [x] T013 Run `npm test` and `git diff --check`; record actual results in `docs/workspace-setup.md`.
- [x] T014 Review changed code and docs against this spec, plan, constitution, and all tests; resolve any remaining feature gaps.
