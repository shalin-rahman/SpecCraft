# Tasks: Secure repository roots and identity setup

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Contain repository scans

- [x] T001 [P] [US1] Add API regression coverage for outside-target directory junctions in `test/platform-http.test.js`.
- [x] T002 [US1] Canonicalize configured/requested roots and check containment before analysis in `src/platform-http.js`.

## Phase 2: Fail closed on identity setup

- [x] T003 [P] [US2] Add tests for missing claims and absent/ambiguous verification sources in `test/production-infrastructure.test.js`.
- [x] T004 [US2] Validate issuer, audience, and exactly one verification source during provider construction in `src/production-infrastructure.js`.

## Phase 3: Documentation and verification

- [x] T005 Update scan boundary and verifier configuration guidance in `docs/platform-specification.md` and `docs/workspace-setup.md`.
- [x] T006 Run `npm test` and `git diff --check`; record actual results in `docs/workspace-setup.md`.
- [x] T007 Review implementation against spec, plan, constitution, and tests; close remaining gaps.
