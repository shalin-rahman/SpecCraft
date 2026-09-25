# SpecCraft knowledge-core implementation plan

## Purpose and scope

This plan closes the gap between the current local reference implementation and the evidence-backed knowledge layer described in the semantic graph specification and review feedback. It covers non-production domain behavior and local adapters only.

Production deployment, managed persistence, production identity integration, external secrets, durable managed queues, distributed rate limiting, production security sign-off, and penetration testing remain specification/runbook work. A local HS256/RS256 identity adapter now verifies configured keys, but the HTTP API does not use it; do not describe it as managed identity or production authentication.

## Verified baseline and first repair pass (2026-09-26)

- Initial sandboxed `npm test` could not spawn the Node test workers (`EPERM`). Outside the sandbox, the working tree initially ran 22 tests: 19 passed and 3 failed. The failures were: code graph node type no longer matched the public `symbol` contract (also leaving reconstruction empty), and unsupported-language parser input was rejected instead of returning its explicit diagnostic. Those compatibility regressions are repaired.
- After the repair and new parser/HTTP contract tests, `npm test`: 25 passed, 0 failed. There is no configured lint, type-check, or build script.
- `package.json` defines `test`, `test:unit`, and `platform`; no lint/build script is present.
- The HTTP server exposes local scan/reconstruct/drift/context/provider/proposal routes.
- The graph builder now routes through `ParserRegistry`, uses Babel AST parsing for JavaScript/TypeScript and conservative lexical extraction for Python, and adds import, route, test, and low-confidence local call observations. These relationships are incomplete and are not a complete semantic code graph.
- Requirement impact traverses graph links, but relationship direction/type semantics and canonical node metadata are incomplete.
- The browser demo and platform API are separate surfaces; there is no production UI/API deployment.
- Production infrastructure modules are local reference contracts and are outside this implementation plan.

## Current → target → gap

| Area | Current verified state | Target for this plan | Gap |
| --- | --- | --- | --- |
| Knowledge model | Validated requirement model plus a separate typed graph model with provenance defaults and human-gated review transitions | Validated typed entities with provenance and review state | Models are not fully unified; entity-specific lifecycle and durable review history are incomplete |
| Graph | Typed node/edge validation, controlled vocabularies, deterministic traversal, and basic coverage report; repository graph remains file/symbol-centric | Typed, deterministic, explainable knowledge graph | Separate code and knowledge graphs; edge direction is caller-defined; no unified canonical project graph |
| Parser | Registry-driven Babel AST extraction for JavaScript/TypeScript; conservative lexical Python extraction | Registry-driven parsing with normalized observations/diagnostics | No full Python AST, symbol resolution, robust scope handling, or parser package for other languages |
| Traceability | `analyzeTraceability` reports reachable implementation/verification nodes and paths | Forward/reverse implementation and verification coverage | Repository analysis has no canonical project graph; limited relationship semantics and artifact-gap reporting |
| Reconstruction | One low-confidence candidate per symbol | Evidence-backed typed candidates with rationale and related artifacts | Candidate is not a domain proposal and review data is sparse |
| Drift | File hash added/removed/changed | File/symbol/relationship changes and potential impact | No symbol-level comparison or graph-aware findings |
| Review/sync | Knowledge-node transitions require actor/reason and evidence for approval/canonicalization; revision store applies generic events; HTTP proposals remain pending in memory | Explicit transitions, review decisions, approval gate, apply/verify history | Review model is not integrated with canonical persistence; no complete HTTP review/apply/verify lifecycle |
| Context | Repository context is substring matching; requirement context traverses available project trace links | Bounded task package with traceable requirements, rules, code, tests, evidence and unknowns | No typed ranking, size bound, or unified code/knowledge graph selection |
| Agent interop | HTTP adapter foundation; no MCP adapter | Stable, thin adapter over core operations | No MCP protocol adapter |
| Production services | Local reference implementations and specifications | Documented production contract only | Deliberately excluded from implementation |

## Capability inventory

| Area | Current verified state | Target status |
| --- | --- | --- |
| Requirements and rules | Requirement model and analysis; rules/workflows remain loose project records | Partial; not all entity-specific validation or lifecycle semantics exist |
| Workflows and API contracts | Demo/project records and syntactic route observations | Partial; route observations are not canonical API contracts |
| Graph and code graph | Separate typed knowledge graph and parser-driven code graph | Partial; no unified graph, imports are external module observations, call resolution is limited |
| Traceability and impact | Basic graph coverage and multi-hop traversal; requirement impact traverses trace links | Partial; path direction and edge meaning are caller-defined, freshness/authority not integrated consistently |
| Drift and synchronization | File hash drift; revisioned generic store; pending in-memory HTTP proposals | Partial; no semantic drift or full approve/apply/verify workflow |
| Reconstruction and provenance | Low-confidence symbol candidates with source location | Partial; no multi-artifact synthesis; candidate links do not become canonical automatically |
| Context and providers | Query-based repository context, requirement context helper, provider routing | Partial; no bounded unified evidence-aware task compiler |
| Persistence, audit, security | Local file adapters and security controls with production contracts documented | Reference only; no managed production persistence, identity, or deployment |
| MCP, agent adapters, UI, collaboration | HTTP API, static demo, and adapter foundations | Planned/partial; no MCP server or complete shared adapter protocol |
| Tests and documentation | Node test suite; specs, plans, README, user guide, threat/runbook docs | Tests cover the repaired parser/API slice; overall documentation still needs a full claim-by-claim consistency pass |

## Dependency-ordered execution

### Phase 0 — Baseline and contract inventory (complete for this repair slice)

- Run the existing complete test suite and inspect source/tests/specs/API.
- Preserve compatible public APIs unless a migration is documented.
- Treat repository files as untrusted; never execute scanned code.

Exit: baseline test result recorded and production scope explicitly excluded.

### First implementation slice — parser graph compatibility (complete)

- Preserve the established public `symbol` node type while retaining parser `kind` metadata.
- Return unsupported-language diagnostics without requiring source content.
- Recognize indented Python methods in the lexical fallback and state its limitations.
- Add parser and local HTTP route contract coverage; update current-scope documentation.

Exit: the full suite passes and scan → candidate → context/drift/proposal routes are exercised without promoting candidates.

### Phase 1 — Canonical domain and graph contract

- Define controlled entity/edge types and validation.
- Model provenance, confidence, source, freshness, review state, and revision only where their semantics are clear.
- Build deterministic graph creation and validation while preserving existing requirement helpers.
- Add focused contract/unit tests before migrating consumers.

Exit: invalid types, dangling links, invalid states, and invalid edges fail explicitly; existing API behavior remains covered.

### Phase 2 — Review and proposal lifecycle

- Define legal transitions for candidate/review/proposal/canonical states.
- Record actor, timestamp, reason, evidence, and prior/next state for each decision.
- Permit canonicalization only through an explicit approved transition.
- Keep repository/AI inference candidate-only.

Exit: accepted/rejected/approved transitions and invalid-transition regressions are tested; no code-derived automatic canonicalization.

### Phase 3 — Parser-driven local code graph

- Route supported files through `ParserRegistry` and normalized parser results.
- Add JavaScript/TypeScript AST parsing and conservative Python extraction, with explicit diagnostics/fallback boundaries.
- Add file, symbol, import/export, test, and route/API observations only when evidence is syntactically reliable.
- Do not claim semantic call resolution or full language support without tests.

Exit: registry is exercised by integration tests; parser omissions are surfaced rather than silently invented.

### Phase 4 — Traceability and coverage

- Resolve graph paths between requirements, rules, workflows, APIs, code, tests, and evidence.
- Add forward and reverse query operations.
- Report requirements lacking implementation or verification and implementation artifacts lacking known specification links.

Exit: coverage reports include explanation/path/evidence and tests for empty, partial, and complete chains.

### Phase 5 — Impact and drift

- Retain hash-based drift and add symbol and relationship deltas based on parser output.
- Traverse the graph deterministically and return complete paths, relation sequence, evidence, confidence, freshness, and review state.
- Describe affected requirements/tests as potential impact, not semantic certainty.

Exit: rename/add/remove/change and multi-hop impact cases are covered; prior file drift shape remains compatible or has a documented additive shape.

### Phase 6 — Reconstruction and synchronization vertical slice

- Create candidate nodes/edges from source/test/doc evidence with source, rationale, confidence, related artifacts, and candidate state.
- Build a reviewable, revision-checked proposal from a drift/coverage finding.
- Support approve/reject/apply/verify as distinct events; never rewrite canonical specs just because code changed.

Exit: end-to-end test covers scan → candidate → evidence/provenance → review → proposal → stale conflict protection → verification record.

### Phase 7 — Context compiler and agent adapter

- Compile deterministic task context through approved graph relationships with bounded size and provenance.
- Include relevant task, requirements, rules, workflows, APIs, code, tests, decisions, findings, evidence, unknowns, and revision metadata.
- Keep provider/agent selection outside core context semantics.
- Add MCP only after stable application operations and protocol contract are tested; avoid exposing internal classes.

Exit: context packages are stable/reproducible for a fixed revision and adapter contract tests pass.

### Phase 8 — Documentation and consistency review

- Synchronize specifications, README, user guide, API descriptions, and examples with observed behavior.
- Label capabilities as implemented, partial/reference, planned, or production-spec-only.
- Review security boundaries, errors, compatibility, full tests, and final diff.

Exit: no known misleading claim or unexplained regression remains; production items remain unimplemented.

## Validation strategy

For each phase:

1. Write/adjust the behavioral specification and acceptance criteria.
2. Add focused unit or contract tests.
3. Implement the smallest compatible change.
4. Run the focused test file, then the full `npm test` suite.
5. Exercise relevant local API/browser behavior when those surfaces change.
6. Review changed files and check documentation against runtime behavior.

Final validation uses `npm test -- --test-reporter=spec`; runtime smoke tests use a local server and disposable temporary repositories. There is no repository lint/build script as of the baseline.

## Backlog linkage

The session task backlog tracks phases for canonical model, review lifecycle, typed graph, parser integration, traceability, reconstruction, drift, context, synchronization proposals, MCP, and regression/documentation verification. Production backlog items remain in the existing production plan and are not implementation tasks here.
