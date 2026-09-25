# Production readiness specification

## Specify

Before production deployment, SpecCraft must provide operational controls for audit retention, rate limiting, secret management, distributed collaboration, AST accuracy, scale, evaluation, and threat modelling.

## Plan

### Audit retention

- Append every proposal, approval, rejection, provider attempt, and permission decision.
- Store actor, tenant/project, timestamp, revision, action, result, and evidence references.
- Make records append-only to application users.
- Define retention and deletion policies per tenant and legal requirement.
- Provide export and integrity verification.

### Rate limiting

- Limit requests by authenticated principal, project, route, and provider.
- Use separate limits for expensive scans and normal reads.
- Return `429` with `Retry-After`.
- Apply provider concurrency limits and circuit breakers.
- Measure rejected requests and queue depth.

### Secret management

- Store only secret references in project configuration.
- Resolve tokens through a managed secret provider in production.
- Never log tokens, authorization headers, or request bodies containing secrets.
- Rotate secrets without redeploying the application.
- Fail closed when a required secret cannot be resolved.

### Distributed collaboration

- Use a durable database for project revisions, proposals, findings, and audit records.
- Use optimistic concurrency with a unique revision.
- Use an outbox for events and idempotency keys for retries.
- Use a queue for repository scans and provider calls.
- Define conflict, retry, cancellation, and recovery behavior.

### Language-specific AST parsers

- Use a versioned parser per language.
- Store parser version and extraction diagnostics.
- Keep syntax extraction separate from semantic inference.
- Add fixture suites for supported language versions.
- Report unsupported syntax rather than guessing.

### Repository-scale performance

- Define fixture repositories at 1k, 10k, and 100k files.
- Measure scan latency, memory, graph build time, incremental update time, and provider context size.
- Enforce budgets in CI and profile before optimizing.
- Use bounded concurrency and incremental hashing.

### Labelled accuracy benchmarks

- Create expert-labelled fixtures for symbols, links, findings, reconstruction, and context selection.
- Report precision, recall, false-positive rate, false-negative rate, and reviewer correction effort.
- Version the dataset and evaluation code.
- Do not promote heuristic features without a documented baseline.

### Security threat modelling

Threat model at minimum:

- malicious repository contents
- path traversal
- secret exfiltration through context
- prompt injection in repository text
- unauthorized cross-project reads
- replayed or conflicting proposals
- provider compromise
- audit tampering
- denial of service through large scans

For each threat, define asset, trust boundary, attack path, control, residual risk, and test.

## Local reference status

The repository has a streaming 1 MB request-body limit, loopback-only access when no bearer token is configured, a timing-safe bearer-token check, a bounded per-process rate limiter keyed by peer address, a 1,000-record in-memory proposal cap, revision-conflict checks, provider routing, parser diagnostics, and scan limits. These controls support local development; they are not managed production services.

The repository also has a local identity adapter that verifies explicit HS256 keys or RS256 signatures from a configured HTTPS JWKS URL. The HTTP API does not yet use it or integrate provider discovery and project authorization. File-backed audit, collaboration, queue, and outbox examples; environment-backed secret helpers; typed provider host checks; and local security-review and evaluation primitives are reference code. Their presence does not mean the service is wired to a managed database, identity provider, secret service, distributed limiter, durable queue, or external security review. Those integrations remain open production work.
