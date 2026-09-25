# Copilot instructions for SpecCraft

## Project identity

This repository is SpecCraft, not SpecForge. Use the name SpecCraft in docs, UI text, code comments, and implementation summaries.

Keep the product scope grounded in the local-first project knowledge layer: repository scanning, requirement/rule/workflow traceability, evidence-backed reconstruction, drift detection, context compilation, and safe provider/model configuration. Do not broaden the product into a generic AI platform or claim managed production infrastructure is implemented unless the code and tests clearly show it.

## Architecture at a glance

SpecCraft is intentionally split between a working local reference implementation and a production contract layer:

- `src/spec-model.js`: requirement, rule, workflow, and evidence modeling
- `src/repository-platform.js`: repository scan and boundary safety
- `src/parser-adapter.js`: parser registry, Babel AST observations for JavaScript/TypeScript, and lexical Python observations
- `src/code-graph.js`: parser-driven code graph construction
- `src/knowledge-graph.js`: typed graph primitives, traversal, traceability coverage, and review transitions; separate from the repository code graph
- `src/platform-services.js`: drift detection, impact analysis, and context compilation
- `src/synchronization.js`: revision conflict handling and optimistic concurrency
- `src/provider-config.js` and `src/provider-router.js`: configuration-driven provider/model routing with failover
- `src/production-infrastructure.js`: local reference implementations for durable audit, secrets, collaboration, queue, outbox, identity, and rate-limiting contracts
- `src/server.js` and `src/platform-http.js`: local HTTP API surface for the platform
- `test/*.test.js`: project validation for the spec model, provider behavior, parser, graph, HTTP routes, and infrastructure contracts

The product is designed to be local-first and configuration-driven. Managed production services are expressed as contracts and deployment requirements, not hardcoded runtime assumptions.

## Build, test, and validation commands

Use these commands from the repo root:

```powershell
npm test
npm run platform
```

For single-test execution:

```powershell
node --test test/spec-model.test.js
node --test test/provider.test.js
node --test test/production-infrastructure.test.js
```

Node.js 20+ is required. The project does not currently define a lint script; prefer the existing test suite as the validation gate for code changes.

## Key conventions specific to this repo

### 1. Keep product scope honest

Distinguish between:

- design docs and planning documents
- local reference implementations
- production-managed stack requirements
- actual verified runtime behavior

Do not claim a feature is implemented if it is only described in a spec or roadmap document. If a capability is not yet verified by code/tests, label it as planned or spec-only.

### 2. Treat provider support as configuration-driven

Spec Kit, OpenSpec, Ollama, and local coding models should be supported by configuration, not by hardcoded behavior. Provider routing must support:

- multiple configured providers
- ordered priority/failover
- disabled providers being skipped
- endpoint validation and safe host restrictions
- timeout and retry limits
- fallback to the next available provider

Do not hardcode URLs, tokens, model names, or provider-specific logic into the core domain logic.

### 3. Preserve separation between local and production infrastructure

The codebase intentionally separates local reference implementations from production-managed services. Keep this distinction clean:

- local reference: in-repo implementation used for tests and behavior validation
- production-managed: contract definitions and deployment expectations for DB, identity, secrets, queues, and rate limiting

Do not describe a real managed database, secret manager, identity provider, or queue as implemented unless the repo actually provides that runtime adapter and the relevant tests cover it.

### 4. Evidence before claims

When describing implementation status, use repository evidence. Before saying a feature is done, check the actual code and the relevant tests or runtime output. If no evidence exists, state that it is pending or planned.

### 5. Use SpecCraft naming everywhere

This repo name and product language should remain SpecCraft. Do not reintroduce legacy naming or product confusion during implementation, docs updates, or UI text edits.

### 6. Prefer conservative reconstruction

Repository-derived artifacts are intentionally treated as candidates, not canonical truth. Evidence and provenance matter. When reconstructing requirements, rules, workflows, or APIs, prefer conservative, evidence-backed summaries over speculative inference.

## Scope guardrails for future work

The repo is not a generic “all-in-one AI platform.” Keep work aligned to the actual project intent:

- project knowledge layer
- requirement and rule traceability
- repository-derived evidence and drift detection
- context synthesis for coding agents
- safe, configuration-driven provider/model orchestration
- local-first foundation with explicit production contract boundaries

Do not expand the project into unrelated agent features, large production deployment assumptions, or broad speculative platform claims without a clear code/test change proving the need.

## Recommended response posture for future Copilot sessions

When asked to implement or review features:

1. Confirm the repo state before claiming completion.
2. State whether the feature is a design doc, local prototype, or verified runtime behavior.
3. Use the relevant tests for the affected area.
4. Keep local-first and production-managed concerns separate.
5. Keep naming and scope aligned with SpecCraft.

For each substantial behavior change or refactor, use the installed Spec Kit workflow before editing code: specify → plan → tasks → analyze → implement → converge. Keep those artifacts in `specs/` and start implementation only after the task list is clear and consistent. Small typo fixes and isolated prose edits do not need a feature spec.

## Documentation voice

Write for the person who needs to use or maintain the project. Prefer specific facts, plain language, and concise explanations over generic product language, repeated summaries, or canned assistant phrasing. Keep plans and proposals clearly labeled, cite official sources for external behavior that may change, and never imply that a person wrote or approved material unless they did.

## Files to consult first for project context

- `AGENTS.md` (Codex and shared workspace guidance)
- `docs/workspace-setup.md` (verified setup, commands, and capability findings)
- `README.md`
- `docs/platform-specification.md`
- `docs/production-readiness-specification.md`
- `docs/production-implementation-plan.md`
- `docs/provider-specification.md`
- `package.json`

These are the highest-value docs for understanding the real product shape and validation expectations.
