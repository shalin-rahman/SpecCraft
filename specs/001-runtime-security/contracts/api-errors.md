# Local API Error Contract

Successful route payloads are unchanged. Error responses remain JSON objects with an `error` string.

| Condition | Status | Response shape |
|---|---:|---|
| Invalid configured bearer token, or missing token from a non-loopback peer | 401 | `{ "error": "Authentication required" }` |
| Malformed JSON or invalid request content | 400 | `{ "error": "..." }` |
| Request body exceeds the configured byte limit | 413 | `{ "error": "Request body is too large" }` |
| Request window exceeded | 429 | `{ "error": "Rate limit exceeded", "retryAfterSeconds": 60 }` |
| Pending proposal capacity reached | 503 | `{ "error": "Proposal capacity reached" }` |

No credentials or raw request-body fragments are returned in error responses.
