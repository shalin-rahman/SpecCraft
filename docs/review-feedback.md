Reviewed GitHub repository [SpecCraft repository](https://github.com/shalin-rahman/SpecCraft?utm_source=chatgpt.com)

The important things is:

> **The repository has moved beyond a concept/demo and now contains a credible reference implementation of several core foundations. But it still does not implement the full SpecCraft architecture we designed in the broader conversations.**
> 
> The biggest missing piece is still the **semantic synchronization/knowledge layer between canonical specifications, code, tests, evidence, and AI agents**.

## 1. What we originally designed vs what is actually implemented
Across the SpecCraft conversations, the intended system became roughly:

```
                         HUMAN
                           │
                           ▼
                 Natural-language intent
                           │
                           ▼
                 ┌─────────────────────┐
                 │   SpecCraft Core    │
                 │                     │
                 │ Canonical Spec/IR   │
                 │ Validation          │
                 │ Provenance          │
                 │ Review/Approval     │
                 │ Decision Records    │
                 └─────────┬───────────┘
                           │
                    Specification Graph
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
       Requirements     Rules         Workflows
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                       API / Data
                           │
                           ▼
                      Code Graph
                           │
                           ▼
                         Tests
                           │
                           ▼
                       Evidence
                           │
                           ▼
                  Continuous Sync
                           ↕
                 AI Agents / Editors
          Codex · Claude · Copilot · Cursor
                  Kiro · MCP · CLI
```
The repository currently implements a meaningful **subset** of that.

---

# 2. Current implementation status
| Capability                       | Current state                            | Assessment |
| -------------------------------- | ---------------------------------------- | ---------- |
| Requirement model                | Implemented                              | 🟢         |
| Requirement validation           | Implemented, basic                       | 🟢/🟡      |
| Ambiguity detection              | Implemented, heuristic                   | 🟡         |
| Evidence/provenance concept      | Partially implemented                    | 🟡         |
| Rules                            | Basic data structure                     | 🟡         |
| Workflows                        | Basic data structure                     | 🟡         |
| Trace links                      | Implemented, basic                       | 🟢/🟡      |
| Specification graph              | Very limited                             | 🔴         |
| Code graph                       | Basic file/symbol graph                  | 🟡         |
| AST-based analysis               | Not actually implemented                 | 🔴         |
| Repository scanning              | Implemented                              | 🟢         |
| Brownfield reconstruction        | Basic candidate generation               | 🟡         |
| Requirements-from-code inference | Very primitive                           | 🔴         |
| Test discovery/mapping           | Not meaningfully implemented             | 🔴         |
| Requirement → code traceability  | Data model only                          | 🔴         |
| Code → requirement traceability  | Not implemented                          | 🔴         |
| Requirement → test traceability  | Data model only                          | 🔴         |
| Multi-hop impact analysis        | Not implemented                          | 🔴         |
| Drift detection                  | File hash level                          | 🟡         |
| Semantic drift                   | Not implemented                          | 🔴         |
| Context compilation              | Basic query/filter                       | 🟡         |
| AI provider abstraction          | Implemented                              | 🟢         |
| Agent adapters                   | Interface-level foundation               | 🟡         |
| MCP                              | Not implemented as a real adapter        | 🔴         |
| Persistent canonical knowledge   | Local foundations only                   | 🔴/🟡      |
| Revision/conflict handling       | Implemented foundation                   | 🟢         |
| Proposal workflow                | Basic                                    | 🟡         |
| Human approval workflow          | Incomplete                               | 🔴         |
| Audit                            | Local + reference durable implementation | 🟢/🟡      |
| Authentication                   | Hook/reference                           | 🟡         |
| Authorization                    | Reference implementation                 | 🟡         |
| Multi-tenancy                    | Architectural foundation                 | 🔴         |
| Durable DB                       | Adapter/reference                        | 🟡         |
| Queue/outbox                     | Reference FS implementation              | 🟡         |
| Production infrastructure        | Significant foundation                   | 🟡         |
| Evaluation framework             | Basic                                    | 🟡         |
| Security/threat model            | Documented                               | 🟢         |
| Product/UI                       | MVP/demo                                 | 🟡         |
| Full SpecCraft product           | Not yet                                  | 🔴         |

---

# 3. The good news: the repo is structurally much better than the earlier prototype
The repository now has a reasonably coherent separation:

```
src/
├── spec-model.js
├── synchronization.js
├── repository-platform.js
├── code-graph.js
├── parser-adapter.js
├── platform-services.js
├── platform-adapter.js
├── platform-http.js
├── provider-config.js
├── provider-router.js
├── production-infrastructure.js
├── audit-rate-limit.js
├── benchmark.js
└── server.js
```
That separation is directionally correct.

In particular, these are good architectural decisions:

### Canonical model
`spec-model.js` establishes:

- requirement
- status
- priority
- evidence
- links
- trace links
- review findings
- context
- impact
That aligns with the requirement we developed in the conversations.

### Deterministic repository analysis
`repository-platform.js` deliberately:

- scopes the repository
- ignores `.git`
- ignores dependencies
- ignores build output
- ignores common secret files
- limits file size
- limits file count
- hashes source files
- doesn't execute repository code
That is exactly the right security posture for an initial brownfield analyzer.

### Candidate provenance
This is particularly important:

```
{
    id: `CAND-${symbol.id}`,
    ...
    source: symbol.evidence,
    confidence: "low",
    reviewState: "candidate"
}
```
This follows one of the most important principles from our earlier discussions:

> **Observed implementation must not automatically become authoritative business intent.**
The repository's own specification explicitly says this as well: evidence first, inference second, human approval before canonical knowledge.

That's a strong architectural choice.

---

# 4. The biggest architectural problem: the "graph" isn't yet the SpecCraft graph
Current `code-graph.js` essentially creates:

```
File
 └── defines → Symbol
```
For example:

```
membership.js
      │
      └── defines
             ↓
      closeMembership()
```
That's useful, but it isn't yet the graph we designed.

The intended graph needs to look more like:

```
REQ-001
  │
  ├── governed-by ──→ BR-001
  │                     │
  │                     └── constrains ──→ WF-001
  │                                           │
  │                                           └── exposes ──→ API-001
  │                                                               │
  │                                                               └── implemented-by
  │                                                                      ↓
  │                                                               MembershipService
  │                                                                      │
  │                                                                      ├── calls → Repository
  │                                                                      │
  │                                                                      └── emits → Event
  │
  ├── implemented-by ──→ closeMembership()
  │
  └── verified-by ──→ test_close_membership
```
And then:

```
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
The repository documentation actually specifies this richer model, including edges such as:

- `defines`
- `imports`
- `tests`
- `implements`
But the current `buildCodeGraph()` only produces `defines`.

So there is a significant **specification-to-implementation gap inside the repository itself**.

---

# 5. The current brownfield reconstruction is far too shallow
Currently:

```
reconstructCandidates(analysis)
```
essentially does:

```
every symbol
      ↓
"Document <symbol>"
      ↓
candidate requirement
```
So:

```
function closeMembership()
```
becomes something like:

```
Document closeMembership
Candidate knowledge inferred from service.py:1
confidence = low
```
That is intentionally conservative, which is good.

But it isn't yet **specification reconstruction**.

The architecture we discussed requires something closer to:

```
Repository
    │
    ├── source code
    ├── tests
    ├── API definitions
    ├── schemas
    ├── configuration
    ├── documentation
    ├── Git history
    └── existing specifications
             │
             ▼
       Evidence extraction
             │
             ▼
       Semantic candidates
             │
             ├── Requirement candidates
             ├── Rule candidates
             ├── Workflow candidates
             ├── API candidates
             ├── Permission candidates
             ├── Architecture candidates
             └── Test/verification candidates
             │
             ▼
       Confidence + provenance
             │
             ▼
       Human review
             │
             ▼
       Canonical specification
```
That is one of the most important future implementation areas.

---

# 6. Drift detection is currently syntactic, not semantic
Current drift:

```
previous hash
       ↓
current hash
       ↓
added / removed / changed
```
This is useful.

But it only tells us:

> `service.py` changed.
It doesn't tell us:

> `REQ-001` may no longer be satisfied because `closeMembership()` changed its state transition.
The eventual model should classify drift:

```
FILE_CHANGED
    ↓
SYMBOL_CHANGED
    ↓
TRACE_LINK_AFFECTED
    ↓
REQUIREMENT_POTENTIALLY_AFFECTED
    ↓
TEST_COVERAGE_AFFECTED
```
For example:

```
BR-017 changed
     │
     ├── WF-004 affected
     ├── API-12 affected
     ├── MembershipService affected
     ├── test_membership.py affected
     └── REQ-031 potentially stale
```
That is where the **specification graph + code graph** become genuinely valuable.

---

# 7. Impact analysis is also only first-degree today
Current `calculateImpact()` gets direct trace links.

So:

```
REQ-001
   ├── BR-001
   └── test/a.js
```
returns:

```
BR-001
test/a.js
```
But the intended system needs transitive graph traversal.

Example:

```
REQ-001
  ↓
BR-001
  ↓
WF-002
  ↓
API-004
  ↓
ServiceA
  ↓
RepositoryB
  ↓
Test-019
```
Changing `REQ-001` should potentially produce a candidate impact set containing the downstream artifacts, with:

- path
- relationship
- confidence
- evidence
- freshness
- review status
And ideally explain **why** each artifact was selected.

---

# 8. Context compilation is currently nowhere near the intended Context Compiler
Current repository context essentially does:

```
query string
     ↓
node ID/name substring match
     ↓
return matching nodes + nearby edges
```
That is a useful prototype.

But our earlier design for SpecCraft's context compiler was substantially richer:

```
Agent asks:
"Implement membership closure validation"
                │
                ▼
       Context Compiler
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
 Requirements Rules     Workflows
     │          │          │
     └──────────┼──────────┘
                ▼
             APIs
                │
                ▼
             Code
                │
                ▼
             Tests
                │
                ▼
           Decisions
                │
                ▼
             Evidence
```
Then produce:

```
ContextPackage
├── task
├── requirements
├── constraints
├── business rules
├── workflows
├── API contracts
├── relevant code
├── tests
├── architecture decisions
├── findings
├── unresolved questions
├── evidence
├── provenance
└── context revision
```
This should be one of the central components of SpecCraft.

---

# 9. Synchronization is a foundation, but not yet synchronization
`KnowledgeStore` is a good start.

This:

```
expectedRevision
```
and:

```
RevisionConflictError
```
give us optimistic concurrency.

And the typed operation:

```
append
```
is much safer than accepting arbitrary functions or executable transformations.

That's good.

But currently synchronization is essentially:

```
proposal
   ↓
revision check
   ↓
append
```
The intended SpecCraft synchronization engine is:

```
                    ┌───────────────┐
                    │ Canonical Spec│
                    └───────┬───────┘
                            ↕
                     Sync Engine
                            ↕
                    ┌───────┴───────┐
                    │               │
                Code Graph       Test Graph
                    │               │
                    └───────┬───────┘
                            ↕
                      Evidence Graph
```
with:

```
detect
→ classify
→ propose
→ explain
→ review
→ approve/reject
→ apply
→ verify
→ record evidence
```
That lifecycle is not implemented yet.

---

# 10. Human approval is not yet a real state machine
The repository has:

```
draft
proposed
approved
deprecated
```
and:

```
pending-review
```
But the actual lifecycle needs to be much more explicit.

I'd expect something like:

```
DISCOVERED
    ↓
CANDIDATE
    ↓
UNDER_REVIEW
    ├──────────────┐
    ↓              ↓
ACCEPTED        REJECTED
    ↓
PROPOSED
    ↓
APPROVED
    ↓
CANONICAL
    ↓
VERIFIED
```
And separately:

```
STALE
CONFLICTED
SUPERSEDED
DEPRECATED
```
This matters because **candidate knowledge and authoritative knowledge are fundamentally different classes of information**.

---

# 11. The repository's own specification is ahead of the implementation
This is one of the most important findings.

For example, `docs/platform-specification.md` describes a code graph containing:

> file, symbol, test, and requirement nodes with typed edges such as `defines`, `imports`, `tests`, and `implements`.
But the implementation currently only creates:

```
file → defines → symbol
```
Likewise, the requirements document says the canonical chain is:

```
Requirement → Rule → Workflow → API → Code → Test → Evidence
```
but the implementation doesn't yet have first-class models for all of those.

So we now have:

```
DOCUMENTED ARCHITECTURE
        │
        │
        ▼
   IMPLEMENTATION
        │
        ├── implemented
        ├── partially implemented
        └── still conceptual
```
SpecCraft should now explicitly track this difference.

That itself is a perfect use case for SpecCraft.

---

# 12. There is also a test-structure issue
I noticed `test/spec-model.test.js` contains nested `test()` declarations inside another test:

```
test("summarizes project status and evidence", () => {
   ...
   test("finds ambiguous and incomplete requirement language", () => {
      ...
   });

   test("compiles context and reports connected impact", () => {
      ...
   });

   assert.deepEqual(...)
});
```
Those tests should be top-level tests rather than nested inside the summary test.

Even if Node's test runner handles the nesting, it makes test ownership/reporting unnecessarily confusing and weakens the test structure.

The intended structure should be:

```
test(...)
test(...)
test(...)
test(...)
test(...)
```
with each behavior independently reported.

---

# 13. The parser architecture is currently misleading
There is a `ParserRegistry`, which is good architectural preparation:

```
ParserRegistry
```
But the actual production graph currently uses regex-based extraction in:

```
code-graph.js
```
rather than the parser abstraction.

That's a significant gap.

The intended architecture should be:

```
Repository
   ↓
Language detection
   ↓
ParserRegistry
   ↓
Language parser
   ↓
AST
   ↓
Normalized Code Model
   ↓
Code Graph
```
not:

```
Repository
   ↓
Regex
   ↓
Symbols
```
Regex is acceptable as the conservative MVP fallback, but the system should make this explicit.

---

# 14. Graphify fits here — but it should not become the canonical model
This connects directly to our earlier Graphify discussion.

I would preserve the architectural boundary:

```
                    SpecCraft
                       │
             Canonical Specification
                       │
                Specification Graph
                       │
                 Traceability
                       │
             ┌─────────┴─────────┐
             │                   │
        Code Graph          External Graph
             │                   │
        AST/parser         Graphify/etc.
```
Graphify or another code-graph technology can provide **implementation intelligence**.

It should not become the authoritative specification store.

The distinction should remain:

```
SpecCraft Canonical Graph
        ≠
Code Graph
        ≠
Agent Memory
```
They are related knowledge layers.

---

# 15. AI provider support is a useful foundation, but AI isn't yet integrated into the knowledge lifecycle
The provider router has good fundamentals:

- provider configuration
- priorities
- fallback
- retries
- timeout
- endpoint allowlisting
- local Ollama support
- secret environment lookup
That's valuable.

But currently:

```
Agent/AI
   ↓
provider.complete()
```
is essentially an isolated capability.

The intended architecture is:

```
Agent
   ↓
SpecCraft Adapter
   ↓
Context Compiler
   ↓
Canonical Knowledge
   ↓
AI reasoning
   ↓
Proposal
   ↓
Evidence
   ↓
Human Review
   ↓
Canonical Knowledge
```
In other words:

> **The model should reason over SpecCraft; it should not become SpecCraft.**
That distinction is central to the product.

---

# 16. Agent independence is not implemented yet
The documentation says adapters should expose:

```
getProjectSnapshot
getContext
submitProposal
getFindings
```
The `PlatformAdapter` establishes the beginning of that contract.

But we don't yet have real integrations for:

- Codex
- Claude
- Copilot
- Cursor
- Kiro
- MCP
- IDE plugins
- CLI workflow
So today the architecture is **adapter-ready**, rather than genuinely agent-independent in operation.

That is an important distinction.

---

# 17. Production infrastructure has progressed significantly
This part is stronger than the core semantic layer.

The repository contains foundations for:

### Audit
`DurableAuditLog`

with:

```
sequence
previousHash
hash
```
creating a hash chain.

### Collaboration
`FileCollaborationStore`

with revision checking.

### Jobs
`FileJobQueue`

with:

- idempotency
- attempts
- leasing
- retry
- dead-letter state

### Outbox
`Outbox`

### Identity
`ManagedIdentityProvider`

### Authorization
`ManagedAuthorizationService`

### Secrets
`SecretManager`
`VaultSecretProvider`

### Distributed rate limiting
`DistributedRateLimiter`

### Security review
`SecurityReviewRunner`

### Managed database boundary
`ManagedDatabaseAdapter`

These are useful infrastructure contracts.

But they are mostly **reference adapters**, not production infrastructure.

The repository itself correctly documents this.

---

# 18. One security concern needs attention in the identity implementation
There is a particularly important point in `ManagedIdentityService`.

The JWT code supports HS256-style verification when a signing secret is supplied, but the managed/JWKS path is not a complete asymmetric JWT verification implementation.

The architecture documents OIDC/JWKS, but the current implementation should not be considered a complete production-grade OIDC verifier.

The production contract correctly requires:

```
signature
issuer
audience
expiry
not-before
token type
key rotation
```
and the implementation still needs to meet that contract completely.

So this should remain explicitly marked as a **reference security adapter**, not production authentication.

---

# 19. There is a deeper concurrency issue in the file-backed infrastructure
Several reference implementations follow:

```
read file
   ↓
modify in memory
   ↓
write file
```
For example:

```
FileJobQueue
FileCollaborationStore
ProjectRepository
```
This is acceptable for local reference testing.

But it isn't equivalent to transactional concurrency.

Two processes can potentially do:

```
Worker A: read revision 5
Worker B: read revision 5

Worker A: write revision 6
Worker B: write revision 6
```
The production specification correctly calls for a database transaction / optimistic concurrency mechanism.

So again:

**the architecture is correct; the current implementation is still reference infrastructure.**

---

# 20. The production documentation is actually quite disciplined
I particularly like that the repository doesn't pretend the reference implementation is production-ready.

The README explicitly states that production still requires:

- managed identity
- durable managed storage
- distributed rate limiting
- external secret management
- encryption
- independent security review
That matches the broader architecture.

This is much better than calling a local Node prototype a production platform.

---

# 21. What I would NOT do now
Based on all the conversations, I would **not** immediately add:

```
50 language parsers
20 IDE plugins
full SaaS UI
autonomous coding agent
massive microservice architecture
```
That would take SpecCraft away from its actual differentiator.

The core needs to become correct first.

---

# 22. The next architectural milestone should be this
I would now make **SpecCraft Knowledge Core v2** the primary target.

```
                    ┌──────────────────────┐
                    │     Human Intent      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Canonical Spec Model │
                    │                      │
                    │ Requirement           │
                    │ Rule                  │
                    │ Workflow              │
                    │ API                   │
                    │ Permission            │
                    │ Decision              │
                    │ Test                  │
                    │ Evidence              │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Specification Graph  │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼──────────────┐
                 ▼             ▼              ▼
             Code Graph     Test Graph    Evidence Graph
                 │             │              │
                 └─────────────┼──────────────┘
                               │
                               ▼
                     ┌──────────────────┐
                     │ Sync / Analysis  │
                     │                  │
                     │ Drift            │
                     │ Impact           │
                     │ Contradiction    │
                     │ Coverage         │
                     │ Staleness        │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ Context Compiler │
                     └────────┬─────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ Agents / Editors   │
                    │                    │
                    │ Codex              │
                    │ Claude             │
                    │ Copilot            │
                    │ Cursor             │
                    │ Kiro               │
                    │ MCP                │
                    └─────────┬──────────┘
                              │
                              ▼
                         Proposal
                              │
                              ▼
                     Human Review/Approve
                              │
                              ▼
                      Canonical Revision
```
That is the product.

---

# 23. Concrete implementation gaps I would create as the next backlog

### P0 — Canonical knowledge model
Replace the current loose objects with first-class entities:

```
Requirement
Rule
Workflow
WorkflowState
APIContract
Permission
ArchitectureDecision
CodeSymbol
Test
Evidence
Finding
TraceLink
ContextPackage
ChangeProposal
ReviewDecision
```
Every entity should have:

```
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

---

### P0 — Typed relationship model
Instead of arbitrary:

```
{
  from,
  to,
  type
}
```
define a controlled relationship vocabulary.

For example:

```
governed-by
constrained-by
contains
transitions-to
exposes
authorized-by
implemented-by
defined-in
calls
imports
tests
verified-by
derived-from
supported-by
contradicts
supersedes
depends-on
```
This becomes the backbone of the graph.

---

### P0 — Real Specification Graph
Implement:

```
nodes
edges
indexes
revision
provenance
```
with deterministic graph traversal.

Then replace:

```
calculateImpact()
```
with actual graph traversal.

---

### P0 — Requirement ↔ implementation ↔ test synchronization
This is the most important functional upgrade.

The system should be able to answer:

> What code implements this requirement?
and:

> Which requirements are potentially affected by this code change?
and:

> Which tests verify this requirement?
and:

> Which requirements currently have no verification?

---

### P0 — Candidate reconstruction pipeline
Move from:

```
symbol → Document symbol
```
to:

```
Evidence
  ↓
Observation
  ↓
Candidate
  ↓
Candidate relationships
  ↓
Confidence
  ↓
Reviewer
  ↓
Approved canonical artifact
```

---

### P1 — AST/code graph
Connect `ParserRegistry` to the actual graph builder.

Start with:

```
JavaScript
TypeScript
Python
```
and extract:

```
file
module
class
function
method
import
call
test
route
export
```
Then add more languages later.

---

### P1 — Semantic drift
Implement:

```
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
Test coverage drift
```

---

### P1 — Context Compiler
Build a proper context package with:

```
task
requirements
rules
workflows
APIs
permissions
code
tests
decisions
findings
evidence
unresolved questions
provenance
revision
```
and deterministic selection.

---

### P1 — Review state machine
Make:

```
candidate
→ proposed
→ under-review
→ approved/rejected
→ canonical
```
real domain behavior rather than merely string fields.

---

### P1 — MCP adapter
This is important for the agent-independent vision.

Expose operations such as:

```
speccraft.project.get
speccraft.context.compile
speccraft.requirement.review
speccraft.graph.query
speccraft.impact.analyze
speccraft.drift.detect
speccraft.proposal.create
speccraft.proposal.review
speccraft.evidence.get
```
Then Codex/Claude/Cursor/etc. become clients of the same knowledge layer.

---

# 24. The most important conceptual correction
I would now sharpen the product terminology.

SpecCraft isn't primarily:

> "an AI that writes specifications."
And it isn't primarily:

> "a better code assistant."
The architecture we've arrived at is closer to:

> **SpecCraft is a persistent, evidence-backed engineering knowledge system that maintains the relationship between human intent, specifications, implementation, tests, decisions, and evidence independently of any particular AI agent or development environment.**
Then AI agents become consumers/producers of proposals against that knowledge system.

That distinction is what makes the project substantially more interesting than another specification generator.

---

# 25. Current maturity, based on the actual repository
I'd describe the repository today as:

```
                 SpecCraft
                    │
        ┌───────────┴────────────┐
        │                        │
   IMPLEMENTED              MISSING/PARTIAL
        │                        │
        ▼                        ▼
 Requirement model       Semantic knowledge graph
 Review heuristics       Full traceability
 Repository scanning     AST/code intelligence
 Basic code graph        Semantic drift
 Candidate inference    Multi-hop impact
 Hash drift              Sync engine
 Context prototype       Context compiler
 Revision control        Approval lifecycle
 Provider routing        Real agent adapters
 Security foundations   MCP integration
 Production contracts   Production deployment
```
So I would **not restart the implementation**.

The existing repository provides a useful foundation.

But I also would **not continue adding infrastructure around the current model yet**.

The priority should now move toward the missing semantic core.

---

# 26. My recommended architecture boundary from here
The cleanest next structure would be:

```
src/
├── domain/
│   ├── knowledge/
│   │   ├── requirement.js
│   │   ├── rule.js
│   │   ├── workflow.js
│   │   ├── api.js
│   │   ├── decision.js
│   │   ├── evidence.js
│   │   ├── test.js
│   │   └── trace-link.js
│   │
│   ├── graph/
│   │   ├── graph.js
│   │   ├── node.js
│   │   ├── edge.js
│   │   └── traversal.js
│   │
│   ├── review/
│   ├── synchronization/
│   └── provenance/
│
├── application/
│   ├── review/
│   ├── reconstruction/
│   ├── impact/
│   ├── drift/
│   ├── context/
│   └── synchronization/
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
    ├── codex/
    ├── claude/
    ├── cursor/
    └── ...
```
This would also align much better with the **SOLID + DDD + Hexagonal + Specification + Adapter + Strategy + CQRS/Outbox** architecture we discussed previously.

---

## Bottom line
The GitHub implementation is **real progress**. It already has a good foundation for:

**requirements → evidence → repository scanning → candidate reconstruction → graph → drift → context → revisioned proposals → provider abstraction → security/production boundaries.**

But the heart of the original SpecCraft idea is still missing:

**a genuinely typed, persistent, provenance-aware specification graph and a semantic synchronization engine connecting that graph to code, tests and evidence.**

That should be the next major implementation phase—not another round of UI, provider integrations, or infrastructure.

I would treat the current repository as **SpecCraft Reference Platform v0.1**, and the next milestone as **SpecCraft Knowledge Core v0.2**, where the actual differentiating technology gets implemented.