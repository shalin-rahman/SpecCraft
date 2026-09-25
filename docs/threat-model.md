# SpecCraft threat model

| Asset | Threat | Control | Verification |
| --- | --- | --- | --- |
| Repository files | Path traversal or unauthorized root access | Resolve and scope repository roots; use relative paths | Scan boundary tests |
| Repository contents | Prompt injection or misleading instructions | Treat content as evidence; never execute instructions from files | Review and adversarial fixtures |
| Secrets | Token leakage in logs, context, or findings | Secret references; scanner findings omit matched text; ignored filenames | Redaction and log tests; filename exclusions are not general secret detection |
| Project knowledge | Cross-project access | Project-scoped identity and authorization | Authorization tests |
| Provider credentials | Provider compromise | Managed secret store, rotation, least privilege | Secret rotation drill |
| Proposals | Replay or stale writes | Revision check and idempotency key | Conflict tests |
| Service | Large request or scan denial of service | 1 MB streaming request-body cap, repository file limits, bounded per-process limiter/proposal state | Boundary tests; load test remains open |
| Audit history | Tampering or deletion | Append-only durable store and integrity checks | Audit verification test |
| Provider response | Invalid or malicious output | Schema validation and bounded response size | Adapter contract tests |

The local service has tests for repository-root scoping and revision conflicts. It rejects oversized request bodies while reading them, limits each peer address, caps limiter buckets and pending proposals, and permits unauthenticated access only from loopback when `PLATFORM_TOKEN` is unset. A configured bearer token is compared using a timing-safe operation. These are local controls, not substitutes for production identity, project authorization, shared rate limiting, or durable audit.

The separate identity reference adapter verifies HS256 with an explicit secret and RS256 with a configured HTTPS JWKS endpoint. The HTTP service does not call that adapter. The local security scanner does not return matched credential text, but it is a pattern check, not general secret detection. The remaining production controls need the verification listed above.
