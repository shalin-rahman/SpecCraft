# SpecCraft MVP implementation plan

## Goal

Deliver one complete, reviewable vertical slice for requirements engineering:

```text
Requirement
  → review findings
  → business rule and workflow
  → evidence and trace links
  → code and test references
  → change impact
  → focused context package
```

The MVP must demonstrate the workflow with a membership-closure example before the project expands to general repository intelligence.

## What is in scope

### 1. Canonical model

The first model contains:

- `Requirement`
- `Rule`
- `Workflow`
- `TraceLink`
- `Evidence`
- `Finding`
- `ContextPackage`

Every object needs an identifier. Links need a type, evidence, confidence, and review state before they can be treated as authoritative.

### 2. Requirement capture

The user can enter a title and description. The system assigns an identifier and stores a draft requirement.

The first version must not silently change user wording. Normalization is limited to trimming whitespace and applying safe defaults.

### 3. Bounded review

The review engine reports candidate findings for:

- vague terms
- missing actor or role
- missing condition or timing
- missing implementation links
- missing test links

Findings are advisory. The system never approves, rejects, or rewrites business intent without a human decision.

### 4. Traceability

The vertical slice links one requirement to:

- a business rule
- a workflow
- an implementation location
- a test location

Each link exposes its source evidence. A link without evidence is not treated as verified.

### 5. Impact analysis

Given a changed requirement or rule, the system reports connected artifacts that may need review. It must say “candidate impact,” not “these files must change.”

### 6. Context compilation

The compiler returns the requirement, related rules, workflows, links, findings, and evidence needed for a task. It must deduplicate references and preserve source locations.

## What is not in scope

The MVP will not claim to provide:

- autonomous business analysis
- automatic contradiction resolution
- full repository understanding
- complete code graph construction
- production database reverse engineering
- automatic two-way synchronization
- automatic approval of inferred requirements
- support for every IDE, model, or agent
- production authentication or multi-tenant storage

These require separate designs, benchmarks, and security reviews.

## Delivery phases

### Phase 1 — Core model

- Define validation rules and lifecycle states.
- Add requirements, rules, workflows, evidence, and trace links.
- Add unit tests for valid data, invalid data, empty input, missing links, and duplicate references.

### Phase 2 — Review engine

- Add bounded ambiguity and completeness checks.
- Return structured findings with type, severity, message, and evidence.
- Keep uncertain findings separate from approved project knowledge.

### Phase 3 — Traceability and impact

- Add link traversal from a changed requirement.
- Report connected rules, workflows, code references, and tests.
- Add tests for disconnected, directly connected, and multi-hop cases.

### Phase 4 — Context compiler

- Build a deterministic context package.
- Deduplicate artifacts.
- Preserve provenance and review state.
- Add tests for relevance and omission of unrelated artifacts.

### Phase 5 — Browser workflow

- Add requirement capture.
- Display findings, trace links, impact, and context.
- Show clear validation errors.
- Keep the UI usable without an assistant or remote service.

### Phase 6 — Evaluation

- Create a small expert baseline for the membership-closure example.
- Measure finding precision and recall.
- Record false positives, false negatives, and reviewer corrections.
- Do not generalize from one scenario without reporting the limitation.

## Acceptance criteria

The MVP is complete only when all of the following are true:

1. A user can enter a requirement in the browser.
2. The requirement is validated and receives an identifier.
3. The review engine returns deterministic findings for known test inputs.
4. A requirement can be linked to a rule, workflow, code location, and test.
5. Every displayed link includes evidence or is marked unverified.
6. A requirement change produces a candidate impact report.
7. The context compiler returns only related artifacts for the selected task.
8. Unit tests cover happy paths and realistic failure paths.
9. The browser loads without console errors.
10. The documentation states the current limitations and confidence boundaries.

## Risk controls

| Risk | Control |
| --- | --- |
| Inferred behavior is mistaken for business intent | Store provenance, confidence, and approval state separately. |
| Review findings create alert fatigue | Use bounded detectors and show evidence for every finding. |
| Impact analysis overstates certainty | Label output as candidate impact and require review. |
| Context compiler omits an important rule | Measure relevance and completeness against an expert baseline. |
| Trace links become stale | Store source paths and revision metadata; re-check links before approval. |
| Sensitive evidence is exposed | Add access control and redaction before connecting real repositories. |
| MVP grows into a platform rewrite | Keep adapters, repository analysis, and multi-agent support outside this slice. |

## Definition of done

The vertical slice is done when it works end to end in the browser, passes unit tests, has documented limitations, and can be evaluated against the membership-closure baseline. It is not done merely because the data model or landing page exists.
