# Research: Secure the Local Reference Runtime

## Repository findings

- `ManagedIdentityService.verifyToken` currently skips all signature checks when no shared secret is provided and treats any `HS*` header as HMAC-SHA-256.
- `ManagedIdentityProvider` stores `jwksUrl`, but the current verifier does not fetch a key set. The existing test accepts a forged token under JWKS-only configuration.
- Claim checks exist for issuer, audience, `exp`, and `nbf`; keep them after signature validation and reject malformed time claims.
- `src/platform-http.js` buffers the request as a string before checking the 1,000,000-character limit. If `PLATFORM_TOKEN` is absent, every distinct Authorization value creates a new rate-limit identity. The proposal list has no capacity.
- `src/audit-rate-limit.js` never removes expired keys.
- `SecurityReviewRunner.scanText` places a match excerpt in each finding, which discloses matched credentials.
- Baseline: `npm test` passes 25 tests on 2026-09-26. The existing unsafe token acceptance is the expected behavior to replace.

## Decisions

1. Keep this change dependency-free and use the crypto APIs available in the declared Node.js 20 minimum.
2. Allow only HS256 with an explicit secret and RS256 with a matching configured JWKS key. Reject `none`, algorithm/key-type confusion, and every other algorithm.
3. Make JWKS verification asynchronous. `fetch` is injected for deterministic tests; use HTTPS only, a bounded timeout/cache/key count, reject duplicate key IDs, and do not follow redirects.
4. Require a finite expiration for identity tokens and validate it before returning claims. Validate `nbf` when present, and validate issuer/audience when configured.
5. Without a platform token, admit only loopback peers. When configured, compare fixed-size digests with `timingSafeEqual`.
6. Keep the request body limit at 1,000,000 bytes. Return 413 on overflow and stop retaining subsequent chunks.
7. Key rate limits on `request.socket.remoteAddress`. Reclaim expired buckets when needed and refuse new buckets at capacity rather than evicting active clients. The default cap is 10,000.
8. Keep all accepted pending proposals at capacity. The default cap is 1,000; reject additional creates with 503 until the process is restarted. Durable proposal lifecycle is a separate feature.
9. Do not return matched source text from security findings. Preserve the rule ID, severity, summary, and context.

## Official references

- [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html), especially algorithm verification, key selection, cryptographic validation, and claim handling.
- [RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html), especially the definitions of `aud`, `exp`, and `nbf`.
- [Node.js 20 crypto API](https://nodejs.org/docs/latest-v20.x/api/crypto.html), for HMAC verification, public-key construction, signature verification, and constant-time comparison.
- [Node.js 20 HTTP API](https://nodejs.org/docs/latest-v20.x/api/http.html), for streaming request handling.
- [Spec Kit existing-project guide](https://github.github.com/spec-kit/guides/existing-projects.html), for choosing a bounded change and checking artifacts before implementation.
