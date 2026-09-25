# SpecCraft requirements

## Product summary

SpecCraft is a project-level knowledge layer for requirements, business rules, workflows, architecture decisions, source-code relationships, tests, evidence, and review findings.

The project knowledge should remain available when a team changes editor, workflow, model, or coding assistant.

## Problem

Project intent is usually spread across documents, tickets, conversations, code, tests, Git history, and previous tool sessions. These sources are difficult to keep consistent. Existing-project tooling can help teams plan work, but it does not automatically recover the intended specification from an existing codebase.

SpecCraft addresses that gap by keeping a structured, versioned, evidence-backed record in the project repository.

## Product boundary

SpecCraft is not another coding assistant and does not replace Git, a requirements system, an issue tracker, or specification-driven development tools.

It provides a common knowledge layer that those tools can read and update through adapters, an API, a CLI, or MCP.

## Canonical knowledge model

The first model should support:

- Requirements
- Business rules
- Workflows and state transitions
- API contracts
- Security and authorization
- Architecture decisions
- Code symbols and relationships
- Tests
- Evidence and provenance
- Findings and review decisions

The main traceability chain is:

```text
Requirement → Rule → Workflow → API → Code → Test → Evidence
```

Each item or relationship should record:

- Source and evidence location
- Version or revision
- Confidence
- Whether it was inferred or provided by a person
- Review and approval state
- Freshness or last-checked time

## Core capabilities

### Requirement review

The system should identify:

- Ambiguous wording
- Missing actors, conditions, outcomes, permissions, timing, or audit details
- Candidate contradictions
- Requirements without implementation links
- Requirements without test links

Findings must include evidence and confidence. The system should ask a person to resolve ambiguity or contradiction rather than decide silently.

### Brownfield reconstruction

For an existing project, SpecCraft may inspect source code, tests, APIs, database structures, documentation, and Git history to create a candidate specification.

Observed behavior must be labeled as evidence or inference. It must not be presented as confirmed business intent until a reviewer approves it.

### Context compilation

For a given task, the system should select only the relevant requirements, rules, workflows, APIs, code symbols, tests, decisions, findings, and evidence. It should measure relevance, completeness, and unrelated content.

### Synchronization and impact analysis

When code or a requirement changes, the system should identify stale links and candidate downstream effects. It should show affected artifacts and evidence instead of making unreviewed changes.

## Recommended MVP

The first implementation should use one membership-closure example:

1. Capture a natural-language requirement.
2. Store its structured fields and source evidence.
3. Add a business rule and workflow.
4. Link an API, source code, and tests.
5. Report ambiguity, missing links, or contradictions.
6. Change one rule and produce an impact report.
7. Compile task-specific context for implementation.

The following should remain outside the first release:

- Full repository-scale code graphs
- Production-scale database and Git-history reconstruction
- Automatic approval of inferred intent
- General-purpose workflow modeling
- Complete bidirectional synchronization
- Adapters for every editor and assistant

## Quality and security

The project should define evaluation baselines and report precision, recall, false positives, false negatives, and reviewer effort.

Sensitive requirements, source code, evidence, and compiled context require access control, redaction, source precedence, freshness rules, and conflict handling.

## Architecture

```text
Human
  ↓
Editor / CLI / Assistant
  ↓
Adapter / API / MCP
  ↓
SpecCraft core
  ├─ Canonical knowledge model
  ├─ Provenance and review
  ├─ Analysis and findings
  ├─ Traceability and impact
  └─ Context compiler
  ↓
Git · Code knowledge · Workflow adapters
```

## Links

- [Product page](../index.html)
- [Research article](./speccraft-research-article.md)
- [Evaluation notes](./evaluations_requirment_engineerings.md)
