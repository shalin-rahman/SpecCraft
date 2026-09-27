# Research: Secure repository roots and identity setup

## Findings

- The HTTP API currently compares `resolve()` paths using `relative()`. These functions normalize path syntax but do not resolve symlinks or Windows junctions.
- Node's `fs/promises.realpath()` returns the target path for a requested linked directory and is available on the supported Node runtime. Comparing both canonical roots keeps configured aliases and in-root links consistent.
- `ManagedIdentityProvider` already has `validateConfiguration()`, but callers must remember to invoke it. Constructor validation prevents use of an invalid instance.
- The verifier can accept HS256 whenever `signingSecret` is configured and RS256 when JWKS is configured. Requiring exactly one configured source removes ambiguity while preserving either supported mode.

## Decisions

Canonicalize the requested and configured roots, check containment on those results, and pass the canonical requested directory to analysis. Validate managed identity configuration at construction time. Keep local HS256 service behavior and HTTP authentication wiring unchanged.
