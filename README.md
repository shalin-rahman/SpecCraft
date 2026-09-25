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

The API listens on `http://127.0.0.1:8787` by default. It exposes health, repository scan, candidate reconstruction, drift, and context endpoints. The service never executes repository code.

## Preview the product page

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`.

## Documentation

- [Requirements overview](docs/requirment-spec-of-SpecCraft.md)
- [Evaluation notes](docs/evaluations_requirment_engineerings.md)
- [Research article](docs/speccraft-research-article.md)
- [MVP implementation plan](docs/mvp-implementation-plan.md)
- [Platform specification](docs/platform-specification.md)
- [Provider specification](docs/provider-specification.md)
- [Production readiness specification](docs/production-readiness-specification.md)
- [Production implementation plan](docs/production-implementation-plan.md)
- [Production service specification](docs/production-service-specification.md)
- [Managed stack selection](docs/managed-stack-selection.md)
- [Production delivery backlog](docs/production-delivery-backlog.md)
- [Launch readiness plan](docs/launch-readiness-plan.md)
- [Security review runbook](docs/security-review-runbook.md)
- [Project standards](docs/project-standards.md)
- [Threat model](docs/threat-model.md)
- [User guide](docs/user-guide.md)
- [Asset index](assets/README.md)

## Current scope

The implementation includes a requirements model and a local platform reference implementation for repository scanning, conservative JavaScript/Python symbol extraction, graph construction, brownfield candidate reconstruction, content-hash drift detection, context compilation, and HTTP access.

Repository-derived results are deliberately marked as candidates. The file-backed audit, collaboration, queue, and outbox adapters are local references. Production deployment still needs managed identity, durable managed storage, distributed rate limiting, external secret management, encryption, and an independent security review.
