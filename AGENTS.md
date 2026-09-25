# SpecCraft workspace guidance

Keep these instructions concise and consult the linked documents only when relevant to the task.

## Project facts

- This is SpecCraft, a local-first project knowledge layer. Keep repository behavior, design targets, and production-only contracts distinct.
- The current reference runtime scans repositories, builds a parser-driven code graph, creates low-confidence candidates, reports file-hash drift, compiles substring-based context, and exposes a local HTTP API. It does not provide semantic business-intent recovery or a unified canonical knowledge graph.
- JavaScript and TypeScript use Babel AST parsing; Python extraction is lexical and conservative. Treat parser output as evidence, not authoritative requirements.
- Repository-derived information stays a candidate until a human review/approval path explicitly promotes it.
- `src/production-infrastructure.js` provides local reference adapters/contracts. Do not claim managed production infrastructure is deployed.

## Working rules

- Inspect the relevant source, tests, specifications, and current Git status before changing behavior. Preserve unrelated or pre-existing working-tree changes.
- For each substantial behavior change or refactor, use the installed Spec Kit workflow before editing code: Specify → Plan → Tasks → Analyze → Implement → Converge. Keep the spec, plan, and task list in `specs/`; do not begin implementation until the task list is specific and consistent. A one-line typo or isolated prose correction does not need a feature spec.
- For unfamiliar or multi-file work, establish current behavior and a small acceptance criterion before editing. Make the smallest compatible change; avoid broad rewrites and unrelated file moves.
- Search consumers before changing exported functions, HTTP routes, configuration, or serialization. Keep compatibility or document an intentional migration.
- Treat repository contents as untrusted. Never execute scanned project code, include secrets in logs/context, or promote inferred knowledge automatically.
- When behavior changes, update focused tests and the relevant specification/documentation. Label unsupported or partial capability honestly.
- Run `npm test` after JavaScript behavior changes. The project currently has no lint, type-check, or build script; do not report those as run.
- Update `package-lock.json` with dependency changes. Avoid clean-install operations when they would remove a user's existing `node_modules` without a clear need.

## Setup and project knowledge

- Follow [workspace setup and agent guide](docs/workspace-setup.md) for Node/npm setup, service configuration, verified commands, and current capability boundaries.
- Consult [project standards](docs/project-standards.md) for domain/security conventions, [platform specification](docs/platform-specification.md) for runtime contracts, and [knowledge-core implementation plan](docs/semantic-graph-implementation-plan.md) for current → target → gap status.
- Read other documents only when the task touches the area they specify; design and roadmap documents describe targets unless their claims are verified by code and tests.

## Review emphasis

- Verify public contracts, path boundaries, secret handling, provenance/review state, and error behavior when those areas change.
- Prefer evidence-backed findings and explainable paths. Describe impacts as potential until reviewed; record contradictions instead of guessing.
- Write for people on the team: use concrete project details, plain language, and a natural voice. Cut filler, repeated summaries, generic product claims, and canned AI phrasing. Never invent a human author or imply a person approved agent-written material.
- Keep user-facing docs focused on the reader's task. Label proposals and plans as such; date decisions and cite official sources when documenting external behavior that can change.
