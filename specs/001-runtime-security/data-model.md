# Runtime State and Validation

This change adds no durable entity or database field. It tightens validation and bounds transient reference state.

## Verified principal

The adapter returns a principal only after a supported signature and claim checks succeed.

- Required verification: explicit algorithm and matching key.
- Required claim: numeric expiration in seconds, not expired outside the configured clock skew.
- Optional claim checks: `nbf`, configured issuer, configured audience, and provider-required tenant.
- Trust boundary: decoded token content is untrusted until all checks complete.

## Rate-limit bucket

- Key: normalized peer address from the HTTP socket.
- State: window start and request count.
- Lifecycle: reset after one window; delete when expired; do not insert new keys after the configured cap is reached.
- Default cap: 10,000 buckets.

## Pending proposal

- State remains `pending-review` in the existing process-local array.
- Default capacity: 1,000 records.
- Capacity is checked before insertion.
- At capacity, a new request is rejected; existing proposals are not removed or overwritten.

## Security finding

Retain rule ID, severity, summary, and source context. Do not include a match excerpt or any other copy of the matched credential.
