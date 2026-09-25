# SpecCraft Constitution

## Core Principles

### I. Verified behavior comes first

Treat source and tests as evidence of what works today. Keep current behavior, target design, and the gap between them distinct. A specification or roadmap is not proof that a capability exists.

### II. Evidence does not become authority on its own

Repository-derived and AI-inferred knowledge remains an observation or candidate until a person reviews and approves it. Keep the source, confidence, provenance, and review state with each claim. Record contradictions for review instead of guessing.

### III. Specify before substantial implementation

For each substantial behavior change or refactor, use Specify → Plan → Tasks → Analyze → Implement → Converge. The artifacts must describe testable outcomes, affected contracts, compatibility, and verification before code changes begin. Small typo and isolated prose corrections are exempt.

### IV. Preserve the brownfield system

Inspect consumers and existing tests before changing public behavior. Prefer the smallest safe change, preserve working behavior, and migrate contracts deliberately. Do not move or replace code only to match a preferred directory structure.

### V. Verification is part of the change

Add focused regression coverage for bugs and boundary behavior. Run the relevant tests, then the full `npm test` suite for JavaScript behavior changes. Update the governing specification and user-facing documentation before calling a behavior change complete.

## Product and Security Boundaries

SpecCraft is a local-first project knowledge layer. Treat scanned repositories as untrusted data and never execute their code. Keep local reference adapters distinct from production-managed infrastructure. Do not claim semantic certainty from syntax, hashes, or inferred relationships. Never expose secrets in findings, logs, provider context, or errors.

## Development Workflow

Use Node.js 20 or newer and the existing ESM structure. Validate external input at boundaries, keep processing deterministic where practical, and preserve provider configuration and repository path restrictions. Do not introduce dependencies or architectural patterns without a concrete need.

## Governance

This constitution governs Spec Kit artifacts and implementation work. When a plan or task conflicts with a principle, revise that artifact before implementation. Amend this constitution only for a deliberate project-level decision, with the reason and date recorded here. Project instructions in `AGENTS.md` provide the operational details and should stay consistent with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26
