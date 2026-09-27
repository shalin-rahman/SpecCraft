# Quickstart: Verify scan-root and identity boundaries

1. Run `npm test`.
2. Confirm an ordinary path under the configured root scans successfully.
3. Confirm a directory junction below the configured root that targets an outside folder receives HTTP 400.
4. Confirm identity construction fails for missing issuer/audience, zero key sources, or both sources.
5. Confirm the existing valid HS256 and RS256/JWKS verification cases still pass.
