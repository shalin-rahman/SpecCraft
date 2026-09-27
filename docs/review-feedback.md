# SpecCraft — Master Implementation Prompt

You are working on the existing `shalin-rahman/SpecCraft` repository.

Treat the **current repository state, tests, project specifications, `AGENTS.md`, and `docs/semantic-graph-implementation-plan.md` as the source of truth for the current implementation**.

Do not rewrite the project.

Do not assume earlier reviews describe the current state.

First inspect the repository and establish the actual current baseline.

## Objective

Evolve SpecCraft into a persistent, evidence-backed project knowledge layer connecting:

```text
Requirements / Rules / Workflows / APIs
              ↕
        Knowledge Graph
              ↕
       Code Graph / Tests
              ↕
           Evidence
              ↕
     Impact / Drift / Context
              ↕
       Review / Synchronization
              ↕
        AI Agents / MCP
```

The goal is **verified synchronization between project intent, specifications, implementation, tests, evidence, and documentation**.

Do not treat AI output or repository inference as authoritative project knowledge.

---

## 1. Start with the current repository

Before changing code:

* inspect the current source tree;
* read `AGENTS.md`;
* read the relevant current specifications/plans;
* inspect existing tests;
* run `npm test`;
* identify the actual current implementation;
* distinguish implemented, partial, planned, and production-spec-only capabilities.

Do not recreate functionality that already exists.

Do not follow an old roadmap blindly if the current code has already moved beyond it.

---

## 2. Work incrementally

Do **one coherent milestone at a time**.

For each milestone:

```text
Inspect
→ Identify exact gap
→ Define intended behavior
→ Identify affected code/spec/tests
→ Implement smallest compatible change
→ Focused tests
→ Full npm test
→ Review diff
→ Synchronize specs/docs
→ Verify behavior
→ Continue
```

If the existing specification, implementation, or tests contradict each other and the intended behavior cannot be established from repository evidence:

**stop and resolve the ambiguity rather than guessing.**

Never leave a milestone knowingly broken.

---

## 3. Preserve the current foundations

The repository already has important working foundations. Preserve them while improving them:

* requirement model and analysis;
* typed knowledge graph;
* provenance/confidence/review metadata;
* deterministic graph traversal;
* parser registry;
* Babel JavaScript/TypeScript extraction;
* conservative Python extraction;
* repository scanning and safety boundaries;
* import resolution;
* code graph;
* traceability/impact analysis;
* candidate reconstruction;
* file-hash drift detection;
* context compilation;
* revision/concurrency protection;
* provider abstraction;
* HTTP platform;
* local reference infrastructure;
* existing tests.

Do not replace working behavior merely for architectural preference.

---

## 4. Primary implementation priority

Follow the current dependency order in the repository's knowledge-core implementation plan.

Prioritize the **research-critical knowledge core**, not premature production infrastructure.

The important progression is:

```text
Canonical knowledge model
→ Review/proposal lifecycle
→ Unified typed graph
→ Better code graph
→ Traceability
→ Impact/drift
→ Evidence-backed reconstruction
→ Semantic synchronization
→ Context compiler
→ Agent/MCP adapter
```

Do not spend major effort on SaaS/UI/managed infrastructure while the semantic knowledge/synchronization core remains incomplete.

---

## 5. Canonical knowledge model

Consolidate the existing project records and graph model where appropriate.

Support meaningful typed entities such as:

```text
Requirement
Rule
Workflow
API
Permission
Decision
Code
Test
Evidence
Finding
Proposal
```

Do not add abstractions simply because they appear in a diagram.

Every new entity or field must have a clear purpose, validation, tests, and consumers.

Preserve:

* source;
* provenance;
* confidence;
* freshness;
* review state;
* evidence;
* revision/history;

where those concepts are actually required.

---

## 6. Knowledge graph

The target semantic relationship is approximately:

```text
Requirement
  → Rule
  → Workflow
  → API
  → Code
  → Test
  → Evidence
```

This is a model, not a rigid path that every project must follow.

Keep the graph:

* typed;
* deterministic;
* explainable;
* validated;
* extensible;
* provenance-aware.

Do not infer node types from ID naming when explicit project data exists.

Do not create dangling or duplicate relationships.

Preserve compatibility with existing public graph/node contracts unless a migration is justified and tested.

---

## 7. Code graph

Continue the current parser-driven approach.

For supported languages, progressively improve:

```text
File
→ Symbol
→ Import / Export
→ Call
→ Test
→ API / Route
```

Use AST information where available.

Keep Python's current conservative/lexical limitations explicit until stronger parsing is actually implemented.

Do not claim semantic call resolution when the implementation only performs limited/local resolution.

Repository contents are untrusted input; never execute repository code during analysis.

---

## 8. Traceability and impact

Make relationships useful for answering:

* Which code implements this requirement?
* Which tests verify it?
* Which requirements may be affected by this code?
* Which requirements lack implementation?
* Which requirements lack verification?
* Which implementation artifacts have no known specification relationship?

Impact traversal must preserve explainable paths containing:

* nodes;
* relationship types;
* evidence;
* confidence;
* freshness;
* review state.

Treat impacts as **potential impacts** until reviewed.

---

## 9. Drift

Keep existing file-hash drift behavior compatible.

Progressively add:

```text
file change
→ symbol change
→ relationship change
→ traceability impact
→ potentially affected knowledge
```

Do not call a file hash change “semantic drift” by itself.

Classify what the evidence actually establishes.

---

## 10. Brownfield reconstruction

Improve the existing symbol-based candidates into evidence-backed candidates.

Target:

```text
Repository
→ Observations
→ Candidate knowledge
→ Evidence
→ Confidence
→ Related artifacts
→ Human review
→ Canonical knowledge
```

Candidates must remain candidates.

Never automatically turn:

* code;
* parser output;
* AI inference;
* documentation fragments

into authoritative requirements.

Every inferred candidate should explain where it came from.

---

## 11. Review and synchronization

The review lifecycle must remain explicit:

```text
discovered
→ candidate
→ under_review
→ accepted / rejected / proposed
→ approved
→ canonical
→ verified
```

with appropriate stale/conflicted/superseded/deprecated states.

Human approval is required for canonicalization.

Build toward:

```text
Detect
→ Classify
→ Collect evidence
→ Find affected knowledge
→ Create proposal
→ Explain
→ Review
→ Approve / Reject
→ Apply
→ Verify
→ Record evidence
```

The existing revision mechanism provides concurrency protection; do not confuse that with complete semantic synchronization.

Do not automatically rewrite specifications because code changed.

---

## 12. Context compiler

Evolve context compilation toward a deterministic, bounded package containing only relevant information, such as:

```text
Task
Requirements
Rules
Workflows
APIs
Relevant code
Tests
Decisions
Findings
Evidence
Unknowns
Provenance
Revision
```

Context must come from the knowledge model/graph rather than being merely a substring search over repository artifacts.

Do not couple canonical context semantics to a particular AI provider.

---

## 13. Agents and MCP

Keep AI agents outside the knowledge authority boundary.

Agents may:

* consume context;
* analyze evidence;
* propose changes;
* create proposals.

They must not silently become the canonical knowledge store.

Once the core application operations are stable, expose them through thin adapters such as HTTP/MCP/CLI.

Do not expose internal classes as the agent contract.

---

## 14. Specifications and documentation must stay synchronized

Whenever behavior changes:

* update the relevant specification;
* update affected tests;
* update architecture/docs where necessary;
* update capability status;
* clearly label partial/reference functionality.

Never document planned functionality as implemented.

Never silently leave the specification behind the implementation.

---

## 15. Testing rules

For every meaningful change:

1. Add/update focused tests.
2. Preserve existing regression coverage.
3. Run `npm test`.
4. Test public API behavior when affected.
5. Test security/path boundaries when affected.
6. Test provenance/review behavior when affected.

Never delete or weaken tests simply to make them pass.

There is currently no configured lint/type-check/build script; do not invent successful results for tools the repository does not provide.

---

## 16. Production boundary

Treat production-oriented infrastructure in the repository according to its documented status.

Do not falsely present local/reference adapters as production infrastructure.

Do not implement managed deployment, identity, durable managed persistence, distributed rate limiting, external secrets, encryption, or production security sign-off unless the current milestone explicitly requires them.

The immediate priority is the **knowledge core**.

---

## 17. Refactoring rules

Refactor when it improves:

* correctness;
* responsibility boundaries;
* dependency direction;
* testability;
* maintainability;
* semantic clarity.

Avoid unrelated rewrites.

Prefer:

```text
characterize
→ introduce
→ migrate
→ verify
→ deprecate
→ remove
```

over destructive rewrites.

Preserve existing public contracts unless a deliberate migration is required.

---

## 18. Definition of done

A milestone is done when:

* intended behavior is implemented;
* existing behavior remains compatible where required;
* focused tests pass;
* `npm test` passes;
* relevant specifications are updated;
* documentation is accurate;
* graph/provenance/review semantics remain valid;
* no known regression is hidden;
* remaining limitations are explicit.

At the end of each milestone, report:

```text
Implemented
Verified
Changed
Remaining
```

Then continue only if the next milestone is sufficiently understood.

---

## Final principle

**Do not optimize for the amount of code changed.**

Optimize for:

```text
Specification
    ↕
Knowledge Graph
    ↕
Implementation
    ↕
Tests
    ↕
Evidence
    ↕
Documentation
```

remaining truthful, explainable, and synchronized.

**Use the current repository as the baseline. Preserve what already works. Implement only the next justified capability. Never guess about project meaning. Never promote inference to canonical knowledge.**
