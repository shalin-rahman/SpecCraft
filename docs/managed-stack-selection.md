# Managed stack recommendation

This project intentionally keeps a local-first reference runtime for development and testability, while the production stack is modeled as explicit contracts that can be swapped behind the same interfaces.

## Candidate production fit

These are recommendations for evaluation, not approved vendor or infrastructure selections. No production stack, release owner, or deployment target has been confirmed.

- Database: PostgreSQL (managed, with connection pooling and read replicas)
- Identity: OIDC provider with issuer, audience, and role claims (Entra ID, Auth0, or a comparable provider)
- Secret management: centralized secret store with rotation and short-lived credentials
- Queue/outbox: durable, idempotent event broker with replay and dead-letter handling
- Distributed rate limiting: shared token bucket or sliding-window limiter backed by a managed cache
- Observability: structured audit log, tracing, request correlation, and centralized metrics

## Why these options fit the current requirements

1. PostgreSQL gives stable transactional guarantees for project state, revisions, and audit history.
2. OIDC is the standard way to enforce issuer, audience, tenant, and role-based authorization without embedding credentials in the app layer.
3. Centralized secret storage keeps runtime config out of source control and supports rotation without redeploying the service.
4. Queue/outbox semantics match the collaboration and background processing contract that the project requires for safe multi-agent operations.
5. Distributed rate limiting prevents the same repository or tenant from creating runaway work under burst conditions.

## Contract boundaries

The production stack should be selected at the infrastructure edge, not inside application domain logic. The local implementations are for development and tests; the production adapters and deployment are not present. A production environment would need managed adapters for:

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

The local runtime remains the development reference. Review and approve the infrastructure choices against deployment, compliance, cost, and operational needs before treating this recommendation as a production decision.
