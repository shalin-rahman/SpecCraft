# Data Model: Secure repository roots and identity setup

No persisted schema changes.

- **Canonical scan root**: Absolute real filesystem path. A scan is allowed only when this path is the configured root or a descendant under the platform's path semantics.
- **Managed verifier settings**: Non-empty issuer and audience, plus exactly one key source: an HTTPS JWKS URL or a shared signing secret.
