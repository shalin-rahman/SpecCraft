# SpecCraft platform specification

## Purpose

This document defines the next platform boundary beyond the MVP. It covers repository analysis, synchronization, adapters, collaboration, and security without claiming that heuristic analysis can recover business intent automatically.

## Design principles

1. **Evidence before inference**: observed code, tests, and documents are evidence. Inferred intent remains a candidate until reviewed.
2. **Deterministic core**: scanning, symbol extraction, graph construction, hashing, and drift comparison must be reproducible.
3. **Least privilege**: repository access is scoped to an explicit root and excludes secrets, dependency folders, and generated output by default.
4. **Version everything**: graph snapshots, findings, sync events, and approvals carry a project revision.
5. **Human approval is authoritative**: assistants can propose changes; only an approved action changes canonical knowledge.
6. **Adapters are replaceable**: editor, agent, MCP, CLI, and HTTP integrations translate into the same core commands.

## Components

### Repository scanner

Scans an explicit repository root and its descendants. The current scanner recognizes JavaScript, TypeScript, and Python source files; skips `.git`, `node_modules`, `dist`, `build`, `coverage`, and `.venv`; skips a small explicit set of local secret filenames; and caps each file at 512 KB and each scan at 2,000 files. This is not general secret detection. Results contain relative paths, file hashes, language, and size.

### Symbol extractor

The current reference implementation uses Babel AST parsing for JavaScript and TypeScript and conservative lexical extraction for Python. It records symbols and line evidence, plus imports, exports, test declarations, and selected route calls for JavaScript/TypeScript. Python extraction is lexical and reports that limitation. Parse errors and unsupported languages produce diagnostics. It does not produce source snippets, resolve arbitrary symbols, or establish business meaning.

### Code graph

The current repository code graph contains file and symbol nodes, plus observed module, API route, and test nodes where detected. Its edges include `defines`, `imports`, `exposes`, `tests`, and limited same-file `calls`; call edges have low confidence and unresolved calls are omitted. A separate knowledge-graph module validates typed nodes and relationships and supports traversal, but repository analysis does not yet merge canonical requirement nodes into its code graph. The snapshot is not immutable and its revision is the scanned-file content hash.

### Brownfield reconstruction

Current reconstruction creates one low-confidence documentation candidate per extracted symbol, with source evidence and `reviewState: "candidate"`. It does not yet combine tests, README files, and existing SpecCraft records or reconstruct typed requirements, rules, workflows, APIs, or permissions. No candidate is approved automatically.

### Drift detection

Current drift detection compares scanned file hashes and reports added, removed, and changed file paths. It does not yet compare symbols or relationships. Drift is a finding, not an automatic edit.

### Synchronization

Synchronization is event-based. A proposal contains an operation, source evidence, expected revision, and author. Applying a proposal requires the expected revision to match and produces a new revision. Conflicts are rejected, not silently merged.

The local reference implementation provides this contract through `KnowledgeStore`. The HTTP proposal route records pending collaboration proposals; a production persistence adapter must apply approved proposals through the same revision check.

### Multi-agent adapters

The HTTP adapter exposes the routes listed below. Stable shared CLI, MCP, and agent adapters are planned; the current HTTP routes do not yet implement the full adapter contract below.

All adapters implement:

```text
getProjectSnapshot
getContext
submitProposal
getFindings
```

The adapter receives a scoped project identifier and returns the same JSON contracts. Model-specific prompts are outside the core.

### Remote collaboration

The local HTTP service checks a submitted proposal's expected revision and stores up to 1,000 pending proposals in memory for the server lifetime; it does not yet persist review decisions or authenticate an individual reviewer identity. Production deployment still requires identity integration, durable database and audit retention, and shared rate limiting.

### Security

The local reference service applies:

- repository-root allowlisting
- path traversal protection
- file size and file count limits
- ignored secret and dependency paths
- no shell execution during scanning
- proposal revision checks
- loopback-only access when `PLATFORM_TOKEN` is unset; otherwise bearer-token authentication using a timing-safe comparison
- streaming request-body limit of 1,000,000 bytes
- per-process rate limiting keyed by the peer address, with a 10,000-bucket cap
- a 1,000-proposal cap that preserves proposals already accepted
- structured error responses without source-content leakage

`ManagedIdentityService` verifies HS256 tokens against an explicit shared secret. `ManagedIdentityProvider` can also verify RS256 tokens against a configured HTTPS JWKS endpoint. These are local reference adapters; the HTTP API does not use them for authentication. Production security still needs provider discovery and integration, project authorization, encryption, secret rotation, network controls, dependency scanning, and a threat-model review.

## API contracts

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health |
| `POST` | `/api/scan` | Scan and extract a repository |
| `POST` | `/api/reconstruct` | Produce candidate knowledge |
| `POST` | `/api/drift` | Compare stored and current snapshots |
| `POST` | `/api/context` | Compile task context |
| `POST` | `/api/proposals` | Submit a revisioned proposal |
| `GET` | `/api/findings` | Read the latest scan revision and pending proposals |
| `GET` | `/api/providers/health` | List configured provider metadata |
| `POST` | `/api/providers/complete` | Send a prompt through the configured provider chain |

Except for `GET /api/health`, routes allow loopback callers when `PLATFORM_TOKEN` is unset. A configured token is required from non-loopback callers and must also match on loopback. `/api/scan` and `/api/drift` accept a repository root within `PLATFORM_REPOSITORY_ROOT`; when that variable is unset, the service process directory is the allowed root. Request bodies over 1,000,000 bytes return 413, exhausted request windows return 429, and proposal capacity returns 503. Provider health reports an empty list when no provider configuration is loaded. Proposals are held in memory for the lifetime of the process, up to 1,000 records.

## Non-goals

The reference implementation is not a hosted SaaS product, does not execute arbitrary repository code, and does not claim semantic understanding from syntax alone. Accuracy must be established with a labelled evaluation set before production use.
