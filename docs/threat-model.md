# SpecCraft threat model

| Asset | Threat | Control | Verification |
| --- | --- | --- | --- |
| Repository files | Path traversal or unauthorized root access | Resolve and scope repository roots; use relative paths | Scan boundary tests |
| Repository contents | Prompt injection or misleading instructions | Treat content as evidence; never execute instructions from files | Review and adversarial fixtures |
| Secrets | Token leakage in logs or context | Secret references, redaction, ignored secret files | Secret scanning and log tests |
| Project knowledge | Cross-project access | Project-scoped identity and authorization | Authorization tests |
| Provider credentials | Provider compromise | Managed secret store, rotation, least privilege | Secret rotation drill |
| Proposals | Replay or stale writes | Revision check and idempotency key | Conflict tests |
| Service | Large scan denial of service | File count/size limits, rate limiting, queue | Load test |
| Audit history | Tampering or deletion | Append-only durable store and integrity checks | Audit verification test |
| Provider response | Invalid or malicious output | Schema validation and bounded response size | Adapter contract tests |

The local implementation covers root scoping, ignored secret paths, request limits, bearer authentication hooks, rate limiting, and revision conflicts. The remaining controls are deployment requirements.
