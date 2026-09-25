# Using the local SpecCraft service

This guide covers the reference service in this repository. It runs locally and keeps scan results and proposals in memory; it is not a production deployment.

## Start the service

Use Node.js 20 or newer. In a fresh checkout, install dependencies with `npm ci` and start the service in one PowerShell window:

```powershell
npm ci
$env:PLATFORM_REPOSITORY_ROOT = (Get-Location).Path
npm run platform
```

`npm ci` replaces an existing `node_modules` folder. If this checkout is already installed, skip that command. The API listens at `http://127.0.0.1:8787` unless `PORT` is set. The configured repository root and its descendants are the only paths the service will scan. If `PLATFORM_REPOSITORY_ROOT` is unset, the server's working directory becomes the root.

Use a second PowerShell window for requests. If `PLATFORM_TOKEN` is configured for the server, send its value as a bearer token on every route except health. Without a configured token, protected routes accept loopback callers only; remote callers are rejected.

```powershell
$headers = @{}
if ($env:PLATFORM_TOKEN) {
  $headers.Authorization = "Bearer $env:PLATFORM_TOKEN"
}
```

## Scan and inspect a repository

```powershell
$body = @{ root = (Get-Location).Path } | ConvertTo-Json
$scan = Invoke-RestMethod http://127.0.0.1:8787/api/scan -Method Post -ContentType "application/json" -Headers $headers -Body $body
$scan.scan.revision
```

The scanner handles JavaScript, TypeScript, and Python source files. It skips configured dependency/build folders and a small list of secret filenames, limits a scan to 2,000 files and 512 KB per file, and does not run repository code. Its filename exclusions are not a general secret scanner.

The API rejects request bodies larger than 1,000,000 bytes. Its default limit is 60 requests per minute per peer address. These counters are local to the process; they are not shared across server instances.

Use the completed scan for repository context or candidate reconstruction:

```powershell
$body = @{ query = "membership closure" } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/context -Method Post -ContentType "application/json" -Headers $headers -Body $body
Invoke-RestMethod http://127.0.0.1:8787/api/reconstruct -Method Post -ContentType "application/json" -Headers $headers -Body "{}"
```

Reconstruction currently emits low-confidence candidates from extracted symbols. Context uses substring matching. Neither result confirms business intent. Drift compares file hashes and reports changed, added, or removed files; it does not determine semantic specification drift.

## Submit a proposal

Proposal submission requires a scan first and the revision returned by that scan:

```powershell
$proposal = @{
  expectedRevision = $scan.scan.revision
  operation = @{ type = "review"; target = "REQ-001" }
  evidence = @()
  actor = "local-user"
} | ConvertTo-Json -Depth 8

Invoke-RestMethod http://127.0.0.1:8787/api/proposals -Method Post -ContentType "application/json" -Headers $headers -Body $proposal
```

Proposals are pending records in process memory, capped at 1,000. When the cap is reached, new proposals return HTTP 503 and earlier proposals remain available. The service does not yet provide review, approval, durable storage, or restart recovery for them. `GET /api/findings` returns the latest scan revision and these pending proposals.

## Configure model providers

Set `PROVIDER_CONFIG` to JSON text in the server environment. The example file uses local HTTP endpoints for records named `spec-kit` and `open-spec`; those names do not mean the service includes native Spec Kit or OpenSpec adapters. The implemented provider kinds are generic `http-model` and `ollama`. For non-loopback endpoints, use HTTPS and list each endpoint hostname in `allowedHosts`. Local HTTP endpoints require `allowLocal: true`.

Keep provider credentials outside source control. A provider can refer to an environment variable using `secretEnv`; health output reports provider metadata but not secret values. Enabled providers are tried in priority order and can use bounded retries. The health route reports configured providers; it does not make a live connection check.

```powershell
$env:PROVIDER_CONFIG = Get-Content .\config\providers.local.json -Raw
$env:PLATFORM_TOKEN = "use-a-secret-from-your-secret-store"
npm run platform
```

From the request window:

```powershell
$body = @{ prompt = "Review this requirement for missing actors and conditions." } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/providers/health -Headers $headers
Invoke-RestMethod http://127.0.0.1:8787/api/providers/complete -Method Post -ContentType "application/json" -Headers $headers -Body $body
```

## Routes and production use

The identity adapter in `src/production-infrastructure.js` verifies HS256 tokens with an explicit secret and RS256 tokens against a configured HTTPS JWKS URL. The HTTP API does not use that adapter; it only applies its local `PLATFORM_TOKEN` boundary. Production use still requires integration with the chosen identity provider, project authorization, durable storage and audit history, external secret management, distributed rate limiting, deployment controls, and independent security review. See the [production delivery backlog](production-delivery-backlog.md) for the open work.
