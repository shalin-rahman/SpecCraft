# Production readiness: Specify, Plan, Implement

## Specify

SpecCraft needs production-grade boundaries for durable audit storage, managed identity, distributed rate limiting, external secrets, durable collaboration, queue and outbox processing, language parsers, scale validation, labelled benchmarks, and independent security testing.

Each concern is a replaceable port. Local adapters are for development and tests; production adapters must use managed infrastructure.

## Plan

1. Define versioned contracts and ownership for each workstream.
2. Add local deterministic adapters behind those contracts.
3. Add integration tests for restart, conflict, retry, and failure behavior.
4. Add production adapters without changing domain code.
5. Run performance, accuracy, threat-model, and independent security gates before release.

### Durable audit

Use append-only records with sequence, previous hash, actor, project, action, revision, result, timestamp, retention policy, export, and integrity verification.

### Managed identity

Validate OIDC/OAuth2 issuer, audience, expiry, signature, tenant, project, and role claims. Deny by default and keep authorization separate from repository analysis.

### Distributed limits and secrets

Use a shared counter backend for limits and a managed secret provider for credentials. Rotate secrets without redeployment and never log credentials.

### Collaboration and jobs

Store revisions, proposals, approvals, findings, and idempotency keys durably. Use an outbox for accepted events and a durable queue for scans and provider calls. Workers must be idempotent.

### Parsers and scale

Use versioned AST adapters by language, preserve diagnostics, and benchmark 1k, 10k, and 100k-file repositories for latency, memory, graph construction, and incremental updates.

### Evaluation and security

Version expert-labelled fixtures and report precision, recall, false positives, false negatives, and reviewer effort. Run threat modelling, independent review, remediation, and retesting.

## Implemented reference scope

This repository implements local reference adapters for append-only audit files, file-backed collaboration revisions, environment-backed secrets, file-backed jobs and outbox, parser registration, benchmark result calculation, labelled dataset shape, and security regression coverage.

## Acceptance criteria

- Interfaces are documented and replaceable.
- Audit records verify after restart.
- Stale writes are rejected.
- Jobs support idempotency keys.
- Secrets are references, not values in project configuration.
- Unsupported syntax is diagnosed, never fabricated.
- 100,000-file measurements are repeatable.
- Labelled evaluations are versioned.
- Security findings are tracked to remediation or explicit acceptance.
