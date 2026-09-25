# SpecCraft

SpecCraft is a project knowledge layer for requirements, rules, decisions, evidence, implementation links, and tests.

It is designed to keep project understanding stable while teams move between editors, workflow tools, and coding assistants.

## Project layout

```text
spec-craft/
├── assets/       Article images and asset index
├── docs/         Requirements, evaluation notes, and final article
├── src/          Runtime code, repository analysis, graph, drift, and API
├── test/         Node unit tests
├── index.html    Static product page
├── styles.css    Product page styles
└── script.js     Product page behavior
```

## Run the unit tests

Requires Node.js 20 or newer.

```powershell
npm test
```

Run the local platform API:

```powershell
npm run platform
```

The API listens on `http://127.0.0.1:8787` by default. It exposes health, repository scan, candidate reconstruction, file-hash drift, context, provider health/completion, and in-memory proposal endpoints. Set `PLATFORM_REPOSITORY_ROOT` to the directory the service may scan; the default is the server's working directory. The service never executes repository code. Protected routes accept loopback requests when `PLATFORM_TOKEN` is unset; non-loopback requests need a configured bearer token. Request bodies are limited to 1 MB, and the local process caps its rate-limit buckets and pending proposals. Route details and limits are in [the platform specification](docs/platform-specification.md).

## Preview the product page

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`.

## Documentation

- [Workspace setup and agent guide](docs/workspace-setup.md)
- [Codex and contributor instructions](AGENTS.md)
- [Requirements overview](docs/requirment-spec-of-SpecCraft.md)
- [Evaluation notes](docs/evaluations_requirment_engineerings.md)
- [Research article](docs/speccraft-research-article.md)
- [Conversation article](docs/SpecCraft_Conversation_Article.docx)
- [Product specification](docs/SpecCraft_Product_Specification_v1.0.docx)
- [MVP implementation plan](docs/mvp-implementation-plan.md)
- [Platform specification](docs/platform-specification.md)
- [Provider specification](docs/provider-specification.md)
- [User guide](docs/user-guide.md)
- [Semantic graph specification](docs/semantic-graph-specification.md)
- [Semantic graph implementation plan](docs/semantic-graph-implementation-plan.md)
- [Production service specification](docs/production-service-specification.md)
- [Production readiness specification](docs/production-readiness-specification.md)
- [Production implementation plan](docs/production-implementation-plan.md)
- [Production delivery backlog](docs/production-delivery-backlog.md)
- [Launch readiness plan](docs/launch-readiness-plan.md)
- [Managed stack recommendation](docs/managed-stack-selection.md)
- [Project standards](docs/project-standards.md)
- [Threat model](docs/threat-model.md)
- [Security review runbook](docs/security-review-runbook.md)
- [Asset index](assets/README.md)

## Current scope

The implementation includes a requirements model and a local platform reference implementation for repository scanning, Babel-based JavaScript/TypeScript extraction, conservative lexical Python extraction, code graph construction, per-symbol brownfield candidates, file-hash drift detection, substring-based repository context, and HTTP access. Parser observations are evidence; they do not establish business intent or semantic correctness.

Repository-derived results are deliberately marked as candidates. The file-backed audit, collaboration, queue, and outbox adapters are local references. Production deployment still needs managed identity, durable managed storage, distributed rate limiting, external secret management, encryption, and an independent security review.
