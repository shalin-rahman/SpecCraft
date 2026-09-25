# Provider and model specification

## Specify

SpecCraft must support configurable workflow providers and coding models without embedding a provider name in core behavior.

Supported provider roles:

- `spec-kit`: Spec Kit workflow adapter
- `open-spec`: OpenSpec workflow adapter
- `ollama`: local Ollama-compatible model endpoint
- `http-model`: any OpenAI-compatible or JSON HTTP model endpoint

The configuration selects:

- enabled providers
- ordered failover priority
- model name
- endpoint
- allowedHosts
- `allowLocal` only for loopback development endpoints
- timeout
- retry count
- capabilities
- secret reference

If a provider is unavailable, times out, rejects a request, or returns an invalid response, the router records the failure and tries the next configured provider. It must not silently mix partial responses.

Secrets are referenced by environment-variable name or an external secret-manager key. Plaintext tokens must not be committed to configuration.

## Plan

1. Define a versioned JSON configuration contract.
2. Validate configuration before starting the service.
3. Implement a generic provider interface.
4. Implement HTTP and Ollama-compatible adapters.
5. Treat Spec Kit and OpenSpec as command/HTTP adapters configured by endpoint or command.
6. Require HTTPS for remote endpoints and require every endpoint hostname to appear in `allowedHosts`.
6. Add ordered failover with timeout and bounded retry.
7. Return provider metadata and failure reasons without exposing secrets.
8. Add health and dry-run checks.
9. Add tests for validation, successful routing, failure fallback, and all-provider failure.

## Implement

The reference implementation provides:

- `src/provider-config.js`
- `src/provider-router.js`
- `config/providers.example.json`
- `GET /api/providers/health`
- `POST /api/providers/complete`

The core receives a provider registry and does not know which provider is first. A production deployment can replace the registry with a database-backed configuration service.

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
- An all-provider failure returns a structured error with sanitized failure metadata.
- Configuration errors fail at startup or validation time.
- Health checks do not include secrets in their output.
