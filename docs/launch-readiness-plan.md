# Launch readiness plan

This document turns the project-level blockers into a staged delivery plan. It is meant to prevent the work from stalling in abstract architecture discussions and to give each dependency a clear owner, exit criterion, and release gate.

## 1. Operating principle

SpecCraft is currently at a working reference implementation stage. It is not yet a production-ready platform because the required production contracts are still not owned, selected, and validated.

The project should not continue as a single broad backlog. It should proceed in locked phases:

1. Phase 0: freeze the product boundary and release target
2. Phase 1: secure the core platform contracts
3. Phase 2: production operational controls
4. Phase 3: scale, benchmark, and independent review
5. Phase 4: launch gate and deployment

## 2. Must do before launch

### 2.1 Production database and migrations
Owner: Platform Engineering + Data

Goal: replace local reference data with durable managed persistence.

Acceptance criteria:
- relational database with migrations, constraints, foreign keys, and transactions
- row-level project and tenant isolation
- durable backup and restore workflow with tested RPO/RTO
- indexes for tenant, project, revision, status, and created time
- idempotent write patterns and optimistic concurrency for revisions
- no secrets stored in config or source control

Exit condition:
- migration tests, restore tests, and tenant-isolation tests pass in a disposable environment

### 2.2 Managed identity and authorization
Owner: Security + Platform

Goal: enforce identity and project-scoped access using a real identity provider.

Acceptance criteria:
- OIDC/OAuth2 discovery and JWKS validation
- issuer, audience, expiry, not-before, and signature checks
- user and service identities are separated
- authorization enforced for every project-scoped operation
- deny-by-default policy on missing claims or permissions
- expired or invalid tokens rejected cleanly

Exit condition:
- auth test suite proves no cross-tenant access and correct role enforcement

### 2.3 Secret management and config hygiene
Owner: Security + DevOps

Goal: remove secrets from config and logs.

Acceptance criteria:
- secrets stored as references only, resolved via managed secret provider
- rotation without code changes
- redaction in logs, traces, errors, and audit records
- missing or revoked secrets fail closed
- least-privilege runtime identity

Exit condition:
- rotation and redaction regression tests pass

### 2.4 Durable queue and outbox
Owner: Backend + Platform

Goal: make background work safe and durable.

Acceptance criteria:
- atomic outbox + domain commit pattern
- consumer idempotency and schema-version checks
- retry, backoff, dead-letter and replay support
- crash-safe redelivery with no duplicate side effects
- correlation IDs and job metadata captured

Exit condition:
- queue redelivery, retry, and poison-message tests pass

### 2.5 Distributed rate limiting
Owner: Platform + Infrastructure

Goal: protect provider calls, scans, and mutations across app instances.

Acceptance criteria:
- shared atomic rate limiter across multiple app nodes
- limits by tenant, principal, project, route, provider, and job class
- consistent 429 + Retry-After responses
- provider, scan, and mutation budgets separated
- fail-closed behavior for protected actions

Exit condition:
- multi-instance burst tests and failover checks pass

### 2.6 Independent security review and penetration testing
Owner: Security + External reviewer

Goal: validate the system before release.

Acceptance criteria:
- no critical or high findings remain without signed risk acceptance
- path traversal, prompt injection, replay, secret exfiltration, and cross-tenant access tested
- remediation retested and recorded
- evidence retained with the release record

Exit condition:
- independent review sign-off and retest evidence are complete

### 2.7 Performance validation at scale
Owner: Performance Engineering

Goal: confirm the project scales under large repos and heavy drift analysis.

Acceptance criteria:
- benchmarks for 1k, 10k, and 100k-file repositories
- measured runtime and memory thresholds
- no O(n²) or runaway memory regressions in graph and drift workflows
- benchmark results retained with configuration metadata

Exit condition:
- benchmark suite passes and results are reviewed by engineering owners

### 2.8 API and service hardening
Owner: Backend + Security

Goal: lock down service boundaries and external behavior.

Acceptance criteria:
- repository-root enforcement for all scan paths
- path traversal and symlink escape rejection
- explicit timeout and retry policies on provider calls
- provider allowlists and HTTPS-only remote enforcement
- sanitized error responses without internal leakage

Exit condition:
- hardening tests and runtime checks pass in CI and staging

### 2.9 Production deployment design
Owner: Architecture

Goal: choose and document the actual deployment target and topology.

Acceptance criteria:
- selected managed database, identity, secret manager, queue, and rate-limit backend
- deployment topology and service boundaries documented
- observability, recovery, and failure-handling model approved
- scaling strategy tied to production assumptions

Exit condition:
- architecture review sign-off is complete

### 2.10 Threat model sign-off
Owner: Security + Architecture

Goal: confirm the design is understood and residual risk is explicit.

Acceptance criteria:
- trust boundaries and data flows documented
- threat register reviewed and approved
- exceptions recorded with owner, due date, and mitigation
- release gate includes security sign-off

Exit condition:
- signed threat-model review is recorded before launch

## 3. Nice to have

These are important but not release blockers if the launch gate is otherwise met.

### 3.1 Provider failover tuning
Owner: Platform

Acceptance criteria:
- config-driven provider ordering for Spec Kit, OpenSpec, Ollama, and generic HTTP providers
- health checks and retry fallback documented
- a single blocked provider does not poison the whole request path

### 3.2 AST parser expansion
Owner: Language Platform / Engineering

Acceptance criteria:
- parser registry expands to supporting languages
- confidence scoring and unsupported-language degrade paths are documented
- extraction quality is benchmarked against representative repositories

### 3.3 Durable collaboration-store improvements
Owner: Product + Platform

Acceptance criteria:
- project review state and proposal history persist durably
- stale-write and conflict detection enforced
- collaboration records remain auditable and queryable

### 3.4 UX polish for the app and docs
Owner: Design + Product

Acceptance criteria:
- consistent editorial styling across the app and docs
- form controls, cards, and page hierarchy read as deliberate product design
- documentation remains grounded and non-AI-generated in tone

### 3.5 Managed stack selection
Owner: Architecture + Engineering leadership

Acceptance criteria:
- final choices documented for database, identity, secret manager, queue/outbox, and rate-limit store
- each choice includes rationale, risk, and fallback options
- no production decision remains vague or deferred

### 3.6 Multi-agent adapter standards
Owner: Platform + AI Architecture

Acceptance criteria:
- provider contracts documented and versioned
- failover and retry semantics formalized
- model selection remains config-driven rather than hardcoded

### 3.7 Brownfield reconstruction validation strategy
Owner: Research + Platform

Acceptance criteria:
- validation plan for repository graph extraction and drift detection documented
- gold-standard examples retained and scored
- inferred evidence is clearly separated from observed evidence

## 4. Phase plan

### Phase 0 — freeze the product boundary
Scope:
- confirm target user, environment, and release scope
- decide what is a local reference implementation and what is production infrastructure
- define the minimum launch gate

Exit criteria:
- owners are assigned
- release target and non-goals are documented
- architecture review starts from one explicit product boundary

### Phase 1 — core platform contracts
Scope:
- database schema and migration plan
- identity and auth
- secret management
- queue and outbox contracts
- rate-limiter contract

Exit criteria:
- contracts are implemented in a test environment
- all contract tests pass
- no hardcoded provider or secret assumptions remain in core logic

### Phase 2 — production safety controls
Scope:
- security hardening
- provider allowlisting and endpoint validation
- API safety boundaries
- audit and retention controls
- operational runbooks

Exit criteria:
- security sign-off gate passes
- logs and secrets are redacted and auditable
- no production policy is left undocumented

### Phase 3 — scale and quality checks
Scope:
- performance benchmarks
- parser quality and labelled evaluation
- collaboration and workflow correctness
- large repository validation

Exit criteria:
- benchmark outputs reviewed and accepted
- accuracy and latency meet the chosen thresholds
- known failure modes are documented

### Phase 4 — launch gate
Scope:
- independent security review
- final deployment design sign-off
- release evidence pack
- launch readiness checklist

Exit criteria:
- all must-do items are complete
- no open critical or high issues remain without approval
- final release package is approved by engineering, security, and architecture owners

## 5. Current project status

Current status is best described as:
- local reference implementation is working
- requirement, code graph, drift, context, and provider routing logic are in place
- production platform contracts and launch controls are not yet fully selected or validated

That means the primary blocker is not technical ambition. It is release discipline. The team should stop broadening scope and proceed with the phase-locked plan above.
