# SpecCraft implementation and review principles

This document records the engineering direction for the existing SpecCraft prototype. It describes intended behavior and working rules; it is not a report that those capabilities are already complete. Use the implementation plan and platform specification for the current verified state.

The project should grow from its working code in small, reviewable steps. Preserve behavior that already works, check the relevant tests and specifications before changing a contract, and keep current behavior, target behavior, and remaining gaps visible as the implementation evolves.

---

# 1. Authoritative sources

Before making changes, understand these sources in this order:

1. Existing source code
2. Existing tests
3. Existing specifications
4. Existing architecture/design documentation
5. Existing research/presentation material
6. Existing README/user documentation
7. Existing implementation plans

Do not assume that documentation is automatically correct.

Do not assume that code is automatically the intended architecture.

Instead determine:

```text
Current implementation
        +
Current specification
        +
Current architecture
        +
Current tests
        ↓
Current verified state
```

Then compare that with the intended SpecCraft architecture.

---

# 2. Important distinction: current state vs target state

Maintain an explicit distinction between:

### CURRENT

What the repository actually implements today.

### TARGET

What the SpecCraft architecture intends to provide.

### GAP

What is missing between CURRENT and TARGET.

Use this model:

```text
CURRENT
   ↓
Verified baseline
   ↓
Gap analysis
   ↓
Target capability
   ↓
Incremental implementation
   ↓
Verification
```

Never silently pretend a target capability already exists.

For example:

```text
File hash changed
```

must not be described as:

```text
Semantic specification drift detected
```

unless the implementation actually performs semantic analysis.

Likewise:

```text
File → Symbol
```

must not be described as a complete knowledge graph.

---

# 3. First action — do not modify code

Before changing anything, perform a complete repository assessment.

Inspect:

* repository structure;
* source files;
* tests;
* package configuration;
* scripts;
* README;
* specifications;
* architecture documentation;
* API documentation;
* implementation plans;
* diagrams;
* configuration;
* persistence adapters;
* provider abstractions;
* security boundaries.

Identify:

* implemented features;
* partial features;
* placeholders;
* duplicated code;
* dead code;
* inconsistent terminology;
* stale documentation;
* missing tests;
* misleading tests;
* architectural violations;
* public API contracts;
* compatibility constraints.

Produce an internal matrix:

| Area             | Current Implementation | Tests | Specification | Gap | Planned Change |
| ---------------- | ---------------------- | ----- | ------------- | --- | -------------- |
| Knowledge model  |                        |       |               |     |                |
| Requirements     |                        |       |               |     |                |
| Rules            |                        |       |               |     |                |
| Workflows        |                        |       |               |     |                |
| Graph            |                        |       |               |     |                |
| Code graph       |                        |       |               |     |                |
| Traceability     |                        |       |               |     |                |
| Impact analysis  |                        |       |               |     |                |
| Drift            |                        |       |               |     |                |
| Reconstruction   |                        |       |               |     |                |
| Synchronization  |                        |       |               |     |                |
| Provenance       |                        |       |               |     |                |
| Review lifecycle |                        |       |               |     |                |
| Context compiler |                        |       |               |     |                |
| Providers        |                        |       |               |     |                |
| Agents/MCP       |                        |       |               |     |                |
| Persistence      |                        |       |               |     |                |
| Security         |                        |       |               |     |                |
| Testing          |                        |       |               |     |                |

Do not start implementation until this assessment is understood.

---

# 4. Establish a baseline

Before modifying code:

* run the complete existing test suite;
* run available lint/static checks;
* run build checks;
* exercise existing APIs;
* verify repository scanning;
* verify candidate reconstruction;
* verify drift detection;
* verify context compilation;
* verify proposal/revision behavior.

Record the baseline.

Separate:

```text
Existing failure
```

from:

```text
Regression introduced by our change
```

Never hide a pre-existing failure.

---

# 5. Non-negotiable change rule

Every implementation change must follow:

```text
Understand
    ↓
Specify intended behavior
    ↓
Identify affected components
    ↓
Check consumers/dependencies
    ↓
Make smallest safe change
    ↓
Run focused tests
    ↓
Run regression tests
    ↓
Review diff
    ↓
Update specifications
    ↓
Update documentation
    ↓
Verify consistency
```

Only then proceed to the next change.

---

# 6. Never make a large unverified change

Avoid changes such as:

* replacing the entire graph implementation;
* moving the entire source tree;
* rewriting all domain models;
* replacing all persistence;
* replacing all parser logic;
* changing every API at once;
* changing public contracts without migration;
* deleting old implementations before proving the replacement works.

Instead use:

```text
Characterize
    ↓
Introduce
    ↓
Migrate
    ↓
Verify
    ↓
Deprecate
    ↓
Remove
```

---

# 7. Preserve existing working functionality

The current repository already contains useful implementation foundations.

Preserve and improve:

* specification model;
* requirement analysis;
* evidence/provenance;
* repository scanning;
* candidate reconstruction;
* code graph;
* drift detection;
* context compilation;
* revision-based proposals;
* provider abstraction;
* audit foundations;
* security foundations;
* production-oriented adapters.

Do not remove these merely because they are incomplete.

Improve them incrementally.

---

# 8. Canonical specification model

The system should progressively support first-class knowledge entities such as:

```text
Requirement
Rule
Workflow
WorkflowStep
APIContract
Permission
ArchitectureDecision
CodeSymbol
Test
Evidence
Finding
TraceLink
ChangeProposal
ReviewDecision
```

Where appropriate, common metadata should include:

```text
id
type
version
status
source
provenance
confidence
createdAt
updatedAt
lastVerifiedAt
reviewState
```

Do not add fields without a semantic reason.

Every field must have:

* meaning;
* lifecycle;
* validation;
* tests;
* serialization behavior where required.

---

# 9. Knowledge authority

SpecCraft must distinguish:

```text
Human-authored
Document-derived
Code-derived
Test-derived
AI-inferred
Human-reviewed
Approved
Verified
```

Repository-derived information must never automatically become authoritative business requirements.

The correct flow is:

```text
Evidence
   ↓
Observation
   ↓
Candidate
   ↓
Review
   ↓
Approved
   ↓
Canonical knowledge
```

This principle must be preserved throughout the system.

---

# 10. Knowledge graph

The existing graph is currently much simpler than the intended architecture.

Do not claim otherwise.

Progressively evolve it from:

```text
File
 └── defines → Symbol
```

toward:

```text
Requirement
 ├── governed-by → Rule
 ├── realized-by → Workflow
 ├── exposed-by → API
 ├── implemented-by → Code
 ├── verified-by → Test
 └── supported-by → Evidence
```

and implementation relationships such as:

```text
File
Module
Class
Function
Method
API
Test
```

with:

```text
defines
imports
calls
tests
implements
exposes
contains
depends-on
```

and knowledge relationships such as:

```text
governed-by
constrained-by
contains
transitions-to
exposes
authorized-by
implemented-by
defined-in
verified-by
derived-from
supported-by
contradicts
supersedes
depends-on
```

The graph must support extension without redesigning the entire system.

---

# 11. Code graph — safe migration

The repository contains a parser abstraction but currently uses relatively simple symbol extraction.

Do not simply delete the existing extraction.

Build:

```text
Repository
   ↓
Language Detection
   ↓
Parser Registry
   ↓
AST
   ↓
Normalized Code Model
   ↓
Code Graph
```

Initially prioritize:

* JavaScript;
* TypeScript;
* Python.

Extract progressively:

* file;
* module;
* class;
* function;
* method;
* import;
* export;
* call;
* test;
* route/API.

Keep a fallback where necessary.

Every parser enhancement must have tests.

---

# 12. Brownfield reconstruction

The current candidate reconstruction must evolve from shallow symbol documentation into evidence-backed reconstruction.

Target:

```text
Existing Repository
      ↓
Evidence Extraction
      ↓
Observations
      ↓
Candidate Knowledge
      ├── Requirement
      ├── Rule
      ├── Workflow
      ├── API
      ├── Permission
      ├── Architecture
      └── Verification
      ↓
Confidence
      ↓
Provenance
      ↓
Human Review
      ↓
Canonical Knowledge
```

Every candidate should explain:

* source;
* evidence;
* inference;
* confidence;
* related artifacts;
* review state.

Never fabricate business intent.

---

# 13. Traceability

Implement meaningful traceability between:

```text
Requirement
   ↓
Rule
   ↓
Workflow
   ↓
API
   ↓
Code
   ↓
Test
   ↓
Evidence
```

The system should progressively answer:

* Which code implements this requirement?
* Which tests verify it?
* Which requirements are affected by this code?
* Which requirements have no implementation?
* Which requirements have no verification?
* Which code has no known specification relationship?
* Which relationships are stale?
* Which evidence supports a relationship?

Do not rely only on direct links.

---

# 14. Multi-hop impact analysis

Replace direct-only impact analysis progressively with graph traversal.

Example:

```text
REQ-104
  ↓
RULE-004
  ↓
WORKFLOW-009
  ↓
API-017
  ↓
SERVICE-022
  ↓
CODE-031
  ↓
TEST-144
```

Impact results should preserve:

* path;
* relationship;
* confidence;
* evidence;
* freshness;
* review state.

Do not merely return a flat list of affected IDs.

---

# 15. Drift detection

Retain existing SHA-256/file-level drift detection.

Then extend it.

Target:

```text
File drift
   ↓
Symbol drift
   ↓
Relationship drift
   ↓
Traceability drift
   ↓
Specification drift
   ↓
Verification drift
```

Classify findings such as:

```text
ADDED
REMOVED
CHANGED
MOVED
RENAMED
RELATIONSHIP_CHANGED
POTENTIALLY_AFFECTED
UNVERIFIED
STALE
CONFLICTED
```

Do not claim semantic certainty from syntactic evidence.

---

# 16. Semantic synchronization

This is a core capability.

The existing revision-controlled proposal system is useful, but it is not itself semantic synchronization.

Build toward:

```text
Detect
   ↓
Classify
   ↓
Collect Evidence
   ↓
Find Related Knowledge
   ↓
Generate Proposal
   ↓
Explain
   ↓
Human Review
   ↓
Approve / Reject
   ↓
Apply
   ↓
Verify
   ↓
Record Evidence
```

Support relationships between:

```text
Specification ↔ Code
Specification ↔ Tests
Code ↔ Tests
Specification ↔ Evidence
```

Never silently rewrite canonical specifications because code changed.

Code changes should produce evidence and proposals.

---

# 17. Review and approval

Use an explicit lifecycle.

Possible states:

```text
DISCOVERED
CANDIDATE
UNDER_REVIEW
ACCEPTED
REJECTED
PROPOSED
APPROVED
CANONICAL
VERIFIED
STALE
CONFLICTED
SUPERSEDED
DEPRECATED
```

Define valid transitions.

Reject invalid transitions.

Record:

* actor;
* timestamp;
* reason;
* evidence;
* previous state;
* new state.

Human approval must remain explicit for authoritative knowledge changes.

---

# 18. Context compiler

The context compiler must eventually construct task-specific context containing relevant:

```text
Task
Requirements
Rules
Constraints
Workflows
APIs
Permissions
Relevant code
Tests
Architecture decisions
Findings
Evidence
Unresolved questions
Provenance
Context revision
```

Context generation should be:

* relevant;
* bounded;
* provenance-aware;
* reproducible where practical;
* independent of any specific AI provider.

---

# 19. AI agent independence

Do not make SpecCraft dependent on one AI provider.

Agents such as:

```text
Codex
Claude
Copilot
Cursor
Kiro
other agents
```

must be treated as clients/adapters.

The architecture is:

```text
SpecCraft Knowledge Core
        ↑
MCP / CLI / API / Adapter
        ↑
AI Agent
```

not:

```text
AI Agent
   ↓
owns project knowledge
```

AI-generated information must retain its provenance.

---

# 20. MCP / agent API

Progressively expose stable operations such as:

```text
speccraft.project.get
speccraft.context.compile
speccraft.graph.query
speccraft.requirement.review
speccraft.impact.analyze
speccraft.drift.detect
speccraft.proposal.create
speccraft.proposal.review
speccraft.evidence.get
```

Keep adapters thin.

Do not expose internal classes as the public protocol.

---

# 21. Specification ↔ implementation synchronization

This is a mandatory rule.

Whenever implementation changes a behavior covered by a specification:

1. identify the affected specification;
2. determine whether behavior still satisfies it;
3. update the implementation OR specification as appropriate;
4. update traceability;
5. update tests;
6. update evidence;
7. update documentation;
8. record the decision.

Likewise, whenever a specification changes:

1. identify affected code;
2. identify affected tests;
3. identify affected workflows;
4. identify affected APIs;
5. identify affected permissions;
6. generate impact findings/proposals;
7. verify implementation after changes.

Do not leave one side silently stale.

---

# 22. Documentation synchronization

Documentation must reflect actual behavior.

After every meaningful feature/refactor:

Check:

* README;
* architecture docs;
* API docs;
* specification;
* implementation status;
* examples;
* diagrams;
* limitations;
* tests.

Do not describe planned functionality as implemented.

Do not leave obsolete architecture descriptions behind.

---

# 23. Tests are part of the implementation

A feature is incomplete without tests.

Maintain:

### Unit tests

Domain behavior, graph behavior, lifecycle, validation, synchronization.

### Integration tests

Repository analysis, parsers, graph building, reconstruction, persistence, API.

### Regression tests

Every important discovered bug should receive a regression test.

### Contract tests

Public API behavior where applicable.

Never delete a test simply because it is inconvenient.

Never weaken an assertion merely to make the test pass.

---

# 24. Test-driven refactoring for risky changes

For risky existing behavior:

```text
Existing behavior
      ↓
Characterization test
      ↓
Refactor
      ↓
Run test
      ↓
Improve implementation
```

For new domain behavior:

```text
Specification
      ↓
Test
      ↓
Implementation
      ↓
Verification
```

This does not require rigid TDD for every line of code, but behavior must be testable before declaring it stable.

---

# 25. Public API compatibility

Before modifying public functions/endpoints/configuration:

Search all consumers.

Prefer:

```text
Add new behavior
      ↓
Compatibility layer
      ↓
Migration
      ↓
Deprecation
      ↓
Removal
```

If a breaking change is necessary:

* document it;
* update consumers;
* update tests;
* provide migration;
* update API documentation.

Never create accidental breaking changes.

---

# 26. Database and persistence

Do not rush into replacing reference/file persistence.

First establish correct domain semantics.

When persistence changes:

* use explicit migrations;
* avoid destructive changes;
* preserve historical records;
* preserve revision information;
* preserve audit history;
* preserve provenance;
* test migration behavior;
* maintain concurrency guarantees.

Clearly distinguish:

```text
Reference implementation
```

from:

```text
Production infrastructure
```

---

# 27. Security

Never weaken existing security controls.

Preserve:

* repository boundary restrictions;
* input validation;
* secret handling;
* authentication;
* authorization;
* audit logging;
* rate limiting.

Repository analysis must not execute arbitrary repository code.

Repository contents must be treated as untrusted input.

Never expose secrets in logs or generated context.

---

# 28. Cleanup rules

Cleanup is encouraged, but only when safe.

Clean up:

* dead code;
* duplicated logic;
* obsolete abstractions;
* inconsistent naming;
* unreachable branches;
* misleading comments;
* stale documentation;
* unnecessary complexity.

Do not perform cosmetic rewrites across unrelated files.

Keep each refactoring logically scoped.

---

# 29. Architectural refactoring

Move gradually toward:

```text
src/
├── domain/
│   ├── knowledge/
│   ├── graph/
│   ├── provenance/
│   ├── review/
│   └── synchronization/
│
├── application/
│   ├── reconstruction/
│   ├── traceability/
│   ├── impact/
│   ├── drift/
│   ├── synchronization/
│   ├── context/
│   └── review/
│
├── infrastructure/
│   ├── repository/
│   ├── parsers/
│   ├── persistence/
│   ├── queue/
│   ├── identity/
│   └── providers/
│
└── adapters/
    ├── http/
    ├── cli/
    ├── mcp/
    └── agents/
```

However:

> **Do not move files merely to make the tree look like this.**

Only introduce a boundary when it improves responsibility, testability, dependency direction, or domain clarity.

---

# 30. Engineering principles

Use appropriate engineering practices including:

* SOLID;
* DRY;
* KISS;
* separation of concerns;
* dependency inversion;
* domain-driven design where useful;
* hexagonal architecture;
* explicit domain boundaries;
* specification pattern where appropriate;
* unit-of-work where persistence requires it;
* domain events where meaningful;
* outbox pattern where asynchronous integration requires it;
* optimistic concurrency;
* immutable evidence/history where appropriate;
* deterministic processing where possible.

Do not apply patterns simply for pattern's sake.

Prefer simple designs that preserve clear semantics.

---

# 31. Self-hosting / self-describing SpecCraft

As the implementation becomes capable, use SpecCraft to describe and analyze itself.

Introduce a meaningful structure such as:

```text
/spec
├── requirements/
├── rules/
├── workflows/
├── decisions/
├── architecture/
├── traceability/
├── evidence/
└── tests/
```

Eventually:

```text
SpecCraft
   ↓
analyzes SpecCraft repository
   ↓
builds knowledge graph
   ↓
checks specification ↔ implementation
   ↓
checks tests
   ↓
detects drift
   ↓
generates proposals
   ↓
human reviews
```

Do not create artificial specifications simply to fill directories.

Only capture meaningful project knowledge.

---

# 32. Implementation order

Follow this order unless repository evidence demonstrates a safer dependency order:

```text
PHASE 0
Baseline + repository audit

PHASE 1
Canonical knowledge model

PHASE 2
Typed knowledge graph

PHASE 3
AST-based code graph

PHASE 4
Traceability

PHASE 5
Multi-hop impact analysis

PHASE 6
Drift / consistency engine

PHASE 7
Brownfield reconstruction

PHASE 8
Context compiler

PHASE 9
Review/proposal lifecycle

PHASE 10
Semantic synchronization

PHASE 11
MCP / agent adapters

PHASE 12
Durable production persistence

PHASE 13
UI / collaboration / SaaS
```

Do not jump to later phases while foundational semantics are unstable.

---

# 33. Vertical slice rule

Do not implement every layer partially if a smaller end-to-end slice can prove the architecture.

Prefer vertical slices such as:

```text
Requirement
   ↓
Rule
   ↓
Code
   ↓
Test
   ↓
Evidence
   ↓
Graph
   ↓
Impact
   ↓
Sync Proposal
   ↓
Review
```

Make one complete path work correctly before multiplying it across the entire repository.

---

# 34. Flagship workflow

The strongest demonstration should be:

```text
Existing Repository
       ↓
Analyze
       ↓
Code Graph
       ↓
Candidate Specifications
       ↓
Evidence + Provenance
       ↓
Human Review
       ↓
Canonical Knowledge
       ↓
Modify Code
       ↓
Detect Change
       ↓
Affected Specifications
       ↓
Affected Tests
       ↓
Drift / Impact Report
       ↓
Synchronization Proposal
       ↓
Human Approval
       ↓
Verification
```

This should become a major integration test and demonstration workflow.

---

# 35. Example synchronization result

A useful result should look conceptually like:

```text
SYNC PROPOSAL #102

Detected:
membership/service.py::close_membership changed

Potentially affected:
REQ-001
RULE-004
TEST-144

Reason:
REQ-001
  → RULE-004
  → close_membership()

Evidence:
commit abc123
source lines 88–112
test TEST-144

Confidence:
0.87

Recommended action:
Review whether REQ-001 remains satisfied.

Status:
UNDER_REVIEW
```

The system should say:

> Evidence indicates that the specification may be affected.

It should NOT automatically say:

> The specification is wrong.

---

# 36. Contradictions must not be silently resolved

If the repository contains conflicting information:

```text
Specification A
       ↕
Specification B
```

or:

```text
Specification
      ↕
Implementation
```

or:

```text
Documentation
      ↕
Implementation
```

do not guess.

Create:

```text
CONFLICT
```

with:

* conflicting artifacts;
* evidence;
* explanation;
* affected relationships;
* review requirement.

Human/authorized review determines the resolution.

---

# 37. Uncertainty must be explicit

Use meaningful confidence/provenance.

Distinguish:

```text
Observed
Inferred
Suggested
Human-confirmed
Verified
Unknown
```

Never convert uncertainty into false certainty.

This is especially important for:

* brownfield reconstruction;
* AI-generated specifications;
* semantic relationships;
* business rules;
* permissions;
* impact analysis.

---

# 38. "fully implemented" means more than code exists

Do not declare a capability complete because a function exists.

A capability is complete only when:

```text
Domain model
+
Application behavior
+
Infrastructure
+
Adapters
+
Validation
+
Tests
+
Error handling
+
Security
+
Persistence where required
+
Documentation
+
Specification
+
Traceability
+
Evidence
+
Compatibility
```

are appropriately handled.

If something is only partial, explicitly label it:

```text
PARTIAL
PROTOTYPE
REFERENCE
PLANNED
```

Never disguise partial functionality as complete.

---

# 39. Final check after each milestone

Before moving forward:

### Code

* Is the code correct?
* Is responsibility clear?
* Is duplication reduced?
* Is there dead code?

### Tests

* Do tests pass?
* Are new behaviors covered?
* Are regressions covered?

### Specification

* Does the specification describe the new behavior?
* Is it still accurate?

### Architecture

* Does the architecture documentation match reality?

### Traceability

* Are relevant relationships updated?

### Evidence

* Can the implementation be traced to evidence?

### Compatibility

* Did existing behavior remain intact?

### Security

* Did security boundaries remain intact?

### Documentation

* Are examples and API descriptions correct?

### Diff

* Are there unrelated changes?

Only continue when the milestone is internally consistent.

---

# 40. Final project-level validation

At the end of the implementation pass, perform a complete consistency review:

```text
Specifications
      ↕
Architecture
      ↕
Domain Model
      ↕
Application Services
      ↕
Infrastructure
      ↕
Adapters
      ↕
Tests
      ↕
Evidence
      ↕
Documentation
```

Identify every remaining inconsistency.

Fix what can safely be fixed.

Explicitly document what remains.

Do not hide limitations.

---

# 41. Most important rule

The governing principle for the entire task is:

> **Do not optimize for the amount of code changed. Optimize for verified convergence between the intended specification, architecture, implementation, tests, evidence, and documentation.**

The repository should become better after every milestone, not merely different.

Never leave the repository in a knowingly broken state at the end of a milestone.

Never make a large speculative change when a smaller verified change can achieve the same architectural progress.

Never silently change project meaning.

Never silently promote inference to authority.

Never claim a capability is complete until its implementation, tests, specifications, documentation, and evidence are sufficiently aligned.

The desired final state is:

```text
                    ┌───────────────────┐
                    │   Human Intent    │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ Canonical Specs   │
                    └─────────┬─────────┘
                              ↕
                    ┌───────────────────┐
                    │ Knowledge Graph   │
                    └─────────┬─────────┘
                              ↕
                    ┌───────────────────┐
                    │ Synchronization   │
                    └──────┬───────┬────┘
                           ↓       ↑
                    ┌─────────┐ ┌─────────┐
                    │Code     │ │Tests    │
                    │Graph    │ │Evidence │
                    └────┬────┘ └────┬────┘
                         ↓           ↓
                    ┌───────────────────┐
                    │ Verified Software │
                    └───────────────────┘
                              ↕
                    ┌───────────────────┐
                    │ Context Compiler  │
                    └─────────┬─────────┘
                              ↓
                    ┌───────────────────┐
                    │ AI Agents / MCP   │
                    └───────────────────┘
```

**Build toward this architecture without breaking the existing repository on the way there.**
