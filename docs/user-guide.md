# SpecCraft user guide

## Start the local service

```powershell
npm install
npm test
npm run platform
```

The local API runs at `http://127.0.0.1:8787`.

## Configure providers

Copy [`config/providers.example.json`](../config/providers.example.json) to a private local file and set `PROVIDER_CONFIG` to its JSON content or load it through your deployment configuration.

The provider list is ordered by `priority`. Lower numbers run first. If a provider fails, the router tries the next enabled provider.

Supported configuration roles:

- Spec Kit through a configured HTTP adapter
- OpenSpec through a configured HTTP adapter
- Ollama through its configured local endpoint
- Any compatible HTTP model endpoint

Example environment setup:

```powershell
$env:PROVIDER_CONFIG = Get-Content .\config\providers.local.json -Raw
$env:PLATFORM_TOKEN = "use-a-secret-from-your-secret-store"
npm run platform
```

Do not commit `providers.local.json`, tokens, or model credentials.

## Check provider health

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/providers/health
```

The response lists IDs, kinds, priorities, and model names. It never returns tokens.

## Ask the configured model chain

```powershell
$body = @{ prompt = "Review this requirement for missing actors and conditions." } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/providers/complete -Method Post -ContentType "application/json" -Body $body
```

## Repository analysis

```powershell
$body = @{ root = (Get-Location).Path } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/scan -Method Post -ContentType "application/json" -Body $body
Invoke-RestMethod http://127.0.0.1:8787/api/reconstruct -Method Post -ContentType "application/json" -Body "{}"
```

Reconstructed results are candidates. Review them before treating them as requirements.

## Operational rules

- Keep provider configuration outside source control.
- Use a managed secret store in shared environments.
- Give each project and user a separate identity.
- Keep audit events append-only in production.
- Put expensive scans behind a queue.
- Run the labelled evaluation suite before changing extraction or context ranking.
- Treat repository text as untrusted input.
