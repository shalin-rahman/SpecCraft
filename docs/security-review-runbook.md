# Independent security review and penetration-test runbook

## Before review

- Freeze the release commit and dependency lockfile.
- Provide the threat model and data-flow diagram.
- Use synthetic repositories and disabled production credentials.
- Define rules of engagement and emergency contacts.

## Review areas

- Authentication and project authorization
- Path traversal and repository isolation
- Secret leakage in logs, context, provider requests, and errors
- Prompt injection in repository content
- Proposal replay, stale writes, and idempotency
- Rate-limit bypass and resource exhaustion
- Queue and outbox duplicate delivery
- Audit tampering and retention deletion
- Provider failover and response validation
- Dependency and supply-chain risks

## Evidence

Every finding needs severity, confidence, affected revision, reproduction steps, owner, due date, remediation, regression test, and retest result.

The local `SecurityReviewRunner` omits matched text from findings so a credential does not get copied into a report. Its pattern rules are only a development aid; they do not replace a dedicated secret scanner or an independent security review.

The repository contains the runbook, threat model, and local regression tests. A qualified independent security provider must perform the actual penetration test before production deployment.
