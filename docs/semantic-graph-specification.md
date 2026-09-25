# Semantic graph specification

This is a target specification. The current repository scanner builds a file/symbol code graph; it does not yet connect canonical requirement, rule, workflow, API, code, and test records into one semantic graph. Current behavior and the implementation gap are recorded in the [platform specification](platform-specification.md) and [knowledge-core plan](semantic-graph-implementation-plan.md).

## Purpose

SpecCraft needs a canonical knowledge graph that links business intent to implementation and verification without treating code as the source of truth. The graph should describe how a requirement becomes a rule, a workflow, an API, code, tests, and evidence.

## Canonical chain

The authoritative chain is:

```
Requirement -> Rule -> Workflow -> API -> Code -> Test -> Evidence
```

This chain is a model and not a hardcoding rule for every project. It is a default ordering for traceability and context synthesis.

## Core node types

- Requirement: user-visible or product-level intent.
- Rule: invariant, policy, or decision constraint.
- Workflow: sequence or state transition that implements the rule.
- API contract: request/response, interface, or external contract.
- Code symbol: function, class, module, or service implementation.
- Test: verification artifact or scenario.
- Evidence: commit, log, issue, decision record, document, or other proof.
- Decision: rationale or approved design selection.

## Relationship types

The graph should support typed links such as:

- governs
- requires
- constrains
- implements
- exposes
- verifies
- tests
- affects
- depends-on
- evidence-for
- supersedes
- reviewed-by

## Candidate vs canonical state

Knowledge should be tracked by state:

- discovered
- candidate
- under_review
- accepted
- proposed
- approved
- canonical
- stale
- conflicted
- superseded
- deprecated

Candidate knowledge must stay separate from canonical knowledge. A repository-derived artifact may be a strong signal but it is not automatically authoritative.

## Human approval lifecycle

```
DISCOVERED
  -> CANDIDATE
  -> UNDER_REVIEW
    -> ACCEPTED
    -> PROPOSED
      -> APPROVED
        -> CANONICAL
          -> VERIFIED

REJECTED -> CANDIDATE
STALE -> CANDIDATE
CONFLICTED -> UNDER_REVIEW
SUPERSEDED -> DEPRECATED
```

This lifecycle is deliberately explicit. It prevents speculative or inferred output from being treated as final product truth.

## Required behavior

The semantic graph must support:

- transitive impact traversal
- provenance on every edge
- confidence scoring per candidate
- drift classification from file or symbol change to impacted requirement
- context package generation for agent tasks
- human approval before canonicalization

## Evidence model

Every node and edge should carry:

- source
- confidence
- freshness
- review status
- created_at
- last_verified_at
- reviewer

## Scope boundary

This layer is non-production behavior in the local reference implementation. Managed production storage and production deployment are documented separately, but are not implemented here.
