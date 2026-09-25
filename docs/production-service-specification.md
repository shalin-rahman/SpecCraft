# Production service specification

This document turns the production concerns into deployable contracts. The application core must depend on interfaces, not on a particular cloud vendor. Each deployment selects one implementation through configuration.

## 1. Managed database

### Required behavior

- Store projects, revisions, proposals, findings, audit records, idempotency keys, outbox rows, and job state.
- Use a relational database with transactions, foreign keys, unique constraints, and migrations.
- Keep tenant and project identifiers on every tenant-owned row.
- Enforce tenant isolation in application authorization and, where supported, database row-level security.
- Use UTC timestamps, stable identifiers, optimistic concurrency, and soft deletion where retention requires history.
- Encrypt in transit and at rest. Back up automatically, test restores, and document the recovery point and recovery time objectives.

### Acceptance gates

- Migration up and down tests pass on a disposable database.
- A restart does not lose committed data.
- Two concurrent writers cannot commit the same revision.
- Restore tests meet the documented RPO/RTO.
- Queries have indexes for tenant, project, revision, status, and created time.
- Credentials come from the secret manager and use least privilege.

## 2. Managed identity and authorization

### Required behavior

- Support OIDC/OAuth2 through a configurable issuer, audience, and discovery document.
- Validate signature, issuer, audience, expiry, not-before, and token type.
- Map subject, tenant, project, and roles into an internal principal.
- Deny by default when a claim or policy is missing.
- Check authorization for every project-scoped read, write, job, provider call, and export.
- Keep service-to-service identity separate from end-user identity.
- Log the decision, not the raw token.

### Acceptance gates

- Invalid, expired, wrong-audience, wrong-issuer, and unsigned tokens are rejected.
- A user cannot read or write another tenant's project.
- Role changes take effect within the documented token and cache lifetime.
- Key rotation works without downtime.
- Authorization tests cover every route and every mutation.

## 3. External secret management

### Required behavior

- Configuration stores secret references only.
- Resolve secrets just in time through a managed provider adapter.
- Cache only for a bounded lifetime and never persist resolved values.
- Support rotation, revocation, version selection, and startup validation.
- Redact values and authorization headers from logs, errors, audit records, traces, and provider prompts.
- Fail closed when a required secret is unavailable.

### Acceptance gates

- Secret values are absent from configuration exports and persisted records.
- Rotation works without a code change.
- Missing and revoked secrets produce explicit operational errors.
- Log and error tests prove redaction.
- The runtime identity can read only the named secret paths.

## 4. Queue and outbox

### Required behavior

- Commit domain state and its outbox message in one database transaction.
- Publish outbox messages with a dispatcher that supports leases, retries, backoff, dead-lettering, and replay.
- Use idempotency keys at enqueue and consumer boundaries.
- Include correlation ID, tenant, project, actor, schema version, and causation ID.
- Bound job payloads and store large repository data outside the queue.
- Support cancellation, visibility timeout, graceful shutdown, and poison-message handling.

### Acceptance gates

- A crash before acknowledgement causes redelivery without duplicate side effects.
- A message is not lost between the domain commit and dispatcher restart.
- Retry and dead-letter metrics are visible.
- Consumers reject unknown schema versions safely.
- Queue permissions allow only the required operations.

## 5. Distributed rate limiting

### Required behavior

- Apply limits by tenant, principal, project, route, provider, and job class.
- Use an atomic shared algorithm such as token bucket or fixed window with bounded clock skew.
- Return `429` and `Retry-After` consistently.
- Keep expensive scans and provider calls separate from cheap reads.
- Add concurrency limits, queue admission limits, and provider circuit breakers.
- Fail closed for protected mutations; use an explicitly documented emergency mode for read-only health checks.

### Acceptance gates

- Limits hold across multiple application instances.
- Concurrent requests cannot exceed the configured budget.
- Redis or equivalent outages produce the documented fail-closed behavior.
- Metrics identify allowed, rejected, queued, and shed work.
- Load tests cover burst, steady-state, and clock-skew cases.

## 6. Independent security testing

### Required behavior

- Maintain the threat model, data-flow diagram, asset inventory, and rules of engagement.
- Run dependency, secret, static, dynamic, API, authorization, and supply-chain checks.
- Commission an independent review before production and after material security changes.
- Test path traversal, cross-tenant access, prompt injection, secret exfiltration, replay, resource exhaustion, queue duplication, audit tampering, and provider compromise.
- Track findings with severity, confidence, evidence, owner, due date, remediation, regression test, and retest result.

### Release gate

- No open critical or high findings without written risk acceptance.
- All fixed findings have regression tests.
- The independent retest confirms remediation.
- The report, exceptions, and evidence are retained with the release record.

## Cross-cutting standards

- Use least privilege, secure defaults, explicit timeouts, bounded input, structured logs, correlation IDs, health checks, metrics, traces, and documented runbooks.
- Version schemas and adapters.
- Do not claim production durability from local file or in-memory adapters.
- Keep provider, database, identity, secret, queue, and rate-limit choices configuration-driven.
- Restrict repository scans to an explicitly configured repository root and reject paths outside it.
- Treat synchronization requests as typed data interpreted by trusted reducers; never execute functions received from a request or persisted proposal.
