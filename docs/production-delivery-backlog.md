# Production delivery backlog

The tasks below are ordered by dependency. Each item has a measurable exit condition.

## Foundation

1. Define versioned database, audit, outbox, queue, identity, secret, and rate-limit interfaces.
2. Add configuration validation for selected adapters, endpoints, timeouts, retention, limits, and feature flags.
3. Add correlation IDs, structured operational logs, metrics, tracing fields, and redaction tests.
4. Add migration tooling, seed data for tests, and disposable integration environments.

## Managed database

5. Implement the project and revision repository with transactions and optimistic concurrency.
6. Implement proposal, finding, approval, idempotency, audit, outbox, and job tables.
7. Add tenant/project indexes, retention jobs, backup policy, restore test, and migration checks.
8. Replace file-backed collaboration and audit paths behind the same interfaces.

## Identity

9. Implement OIDC discovery, JWKS caching, signature validation, issuer and audience checks.
10. Implement principal and project-role mapping with deny-by-default policy evaluation.
11. Protect every HTTP route and background job with authorization tests.
12. Add key rotation, token-cache expiry, service identity, and incident runbooks.

## Secrets

13. Implement a managed secret adapter and reference-only configuration schema.
14. Add bounded caching, version selection, rotation, revocation, startup checks, and redaction.
15. Remove direct provider-token reads from application code and test missing-secret behavior.

## Queue and outbox

16. Add transactional outbox writes and a lease-based dispatcher.
17. Add queue workers for scans, provider requests, synchronization, and benchmarks.
18. Add retries, backoff, dead-letter handling, cancellation, graceful shutdown, and replay.
19. Add idempotent consumers, schema-version checks, and crash/restart tests.

## Distributed rate limiting

20. Implement an atomic shared-store limiter with tenant, principal, route, and job-class keys.
21. Add concurrency budgets, provider circuit breakers, `429` responses, and `Retry-After`.
22. Run multi-instance burst and failure tests, then publish operating limits and dashboards.

## Security validation

23. Expand security regression tests and run dependency, secret, static, and dynamic checks.
24. Freeze a release candidate and provide the threat model, data flows, test tenant, and rules of engagement.
25. Commission independent review and penetration testing.
26. Remediate findings, add regression tests, complete retesting, and record accepted residual risk.

## Release gates

- Unit, integration, contract, migration, authorization, resilience, load, and browser tests pass.
- Restore, rotation, key rollover, queue redelivery, limiter failover, and audit verification have evidence.
- No critical or high security finding remains without signed risk acceptance.
- A runbook exists for outage, credential rotation, data restore, queue drain, and incident response.
