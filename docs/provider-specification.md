# Provider and model specification

## Specify

The local service routes completion requests through configured providers without embedding a provider URL or model name in core behavior. This is a provider-routing foundation, not a set of native workflow integrations.

Supported provider roles:

- `http-model`: a generic JSON-over-HTTP completion endpoint (the example IDs `spec-kit` and `open-spec` are labels only)
- `ollama`: an Ollama-compatible chat endpoint

The configuration selects:

- enabled providers
- ordered failover priority
- model name
- endpoint
- required `allowedHosts` containing the endpoint hostname
- `allowLocal` only for loopback development endpoints
- timeout
- retry count
- capabilities
- secret reference

If a provider fails, times out, returns non-success HTTP, or returns invalid JSON, the router records a failure and tries the next configured provider. It returns the first JSON object response without interpreting it as a validated application-level completion. The router does not silently combine partial responses.

Local configuration accepts timeouts from 1 through 120,000 milliseconds and retry counts from 0 through 5. These bounds keep a single configuration from creating unbounded waits or retry loops.

Secrets are referenced by environment-variable name or an external secret-manager key. Plaintext tokens must not be committed to configuration.

## Implemented locally

1. Define a versioned JSON configuration contract.
2. Validate configuration before starting the service.
3. Implement a generic provider interface.
4. Implement HTTP and Ollama-compatible adapters.
6. Require HTTPS for remote endpoints and require every endpoint hostname to appear in `allowedHosts`.
7. Add ordered failover with timeout and bounded retry.
8. Return provider metadata and failure reasons without exposing secret values.
9. Expose configured provider metadata through a health route.
10. Cover configuration validation and provider routing with tests.

There is no dry-run or live connectivity check, native Spec Kit or OpenSpec integration, capability negotiation, or response-schema validation yet. All-provider failure currently reaches the HTTP handler as a 400 error.

## Implement

The local reference implementation provides:

- `src/provider-config.js`
- `src/provider-router.js`
- `config/providers.example.json`
- `GET /api/providers/health` (configuration metadata only; no network probe)
- `POST /api/providers/complete`

The core receives a provider registry and does not know which provider is first. The registry is loaded from `PROVIDER_CONFIG` when the server starts. Production deployment still needs a protected configuration service and approved provider policy.

## Configuration example

```json
{
  "version": 1,
  "providers": [
    {
      "id": "spec-kit",
      "kind": "http-model",
      "enabled": true,
      "priority": 10,
      "endpoint": "http://127.0.0.1:9001/spec-kit",
      "allowedHosts": ["127.0.0.1"],
      "allowLocal": true,
      "model": "configured-by-service",
      "timeoutMs": 30000,
      "retries": 1
    },
    {
      "id": "open-spec",
      "kind": "http-model",
      "enabled": true,
      "priority": 20,
      "endpoint": "http://127.0.0.1:9002/open-spec",
      "allowedHosts": ["127.0.0.1"],
      "allowLocal": true,
      "model": "configured-by-service",
      "timeoutMs": 30000,
      "retries": 1
    },
    {
      "id": "ollama-local",
      "kind": "ollama",
      "enabled": true,
      "priority": 30,
      "endpoint": "http://127.0.0.1:11434/api/chat",
      "allowedHosts": ["127.0.0.1"],
      "allowLocal": true,
      "model": "qwen2.5-coder:7b",
      "timeoutMs": 60000,
      "retries": 0
    }
  ]
}
```

## Acceptance criteria

- No provider URL, model name, or token is hardcoded in core code.
- Disabled providers are never called.
- Providers are attempted in ascending priority order.
- A failed provider does not prevent the next provider from serving the request.
- An all-provider failure stops the chain; current HTTP behavior is a 400 JSON error. A stable structured failure contract with sanitized per-provider metadata remains planned.
- Configuration errors fail at startup or validation time.
- Provider health metadata does not include secret values; it is not a connectivity check.
