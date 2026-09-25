# Verify the Runtime Security Changes

From the repository root, run the full suite:

```powershell
npm test
```

The regression tests must demonstrate all of the following:

- A JWKS-signed RS256 token with a matching key and valid claims is accepted.
- A forged signature, unknown key, unsupported algorithm, expired token, or claim mismatch is rejected.
- HS256 is accepted only with an explicit shared secret and a valid HMAC.
- An oversized request is rejected with HTTP 413 without accumulating the full body.
- Changing Authorization values from one peer does not create new rate-limit buckets.
- Expired buckets can be reclaimed, and the bucket count remains bounded.
- A full proposal store rejects new writes while keeping earlier proposals intact.
- Secret-literal scan results do not contain the matching credential.

No provider credentials or external identity service are needed; tests inject a local JWKS response and use generated test-only keys.
