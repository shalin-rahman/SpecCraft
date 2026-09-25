# Managed stack selection

This project intentionally keeps a local-first reference runtime for development and testability, while the production stack is modeled as explicit contracts that can be swapped behind the same interfaces.

## Recommended production fit

- Database: PostgreSQL (managed, with connection pooling and read replicas)
- Identity: OIDC provider with issuer, audience, and role claims (Entra ID, Auth0, or a comparable provider)
- Secret management: centralized secret store with rotation and short-lived credentials
- Queue/outbox: durable, idempotent event broker with replay and dead-letter handling
- Distributed rate limiting: shared token bucket or sliding-window limiter backed by a managed cache
- Observability: structured audit log, tracing, request correlation, and centralized metrics

## Why this is the best fit

1. PostgreSQL gives stable transactional guarantees for project state, revisions, and audit history.
2. OIDC is the standard way to enforce issuer, audience, tenant, and role-based authorization without embedding credentials in the app layer.
3. Centralized secret storage keeps runtime config out of source control and supports rotation without redeploying the service.
4. Queue/outbox semantics match the collaboration and background processing contract that the project requires for safe multi-agent operations.
5. Distributed rate limiting prevents the same repository or tenant from creating runaway work under burst conditions.

## Contract boundaries

The production stack is selected at the infrastructure edge, not inside the application domain logic. The project continues to support a local JSON/FS-backed implementation for testability, while production code can plug in managed adapters for:

- durable storage
- identity verification
- secret resolution
- queue delivery and retries
- rate limiting
- independent security scanning

## Release gates

Before launch, the selected stack must satisfy:

- database migration plan and backup strategy
- identity token validation with issuer, audience, and expiry checks
- secret rotation and access policy review
- queue replay and dead-letter path validation
- distributed rate-limit behavior under concurrent burst traffic
- independent security review and audit sign-off

## Summary

The local runtime remains the default implementation for development. The production stack is intentionally fixed as a contract, not as a hardcoded runtime assumption, so deployment choices can be made deliberately and validated without polluting the core domain architecture.
