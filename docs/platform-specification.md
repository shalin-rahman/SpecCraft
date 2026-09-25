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

Scans an explicit repository root. It follows a deny list for `.git`, `node_modules`, build output, secrets, and binary files. It returns relative paths, file hashes, language, and size.

### Symbol extractor

Extracts conservative symbols from JavaScript, TypeScript, Python, and common class/function syntax. It records line numbers and source snippets. Unsupported syntax is reported as an extraction gap instead of being guessed.

### Code graph

The graph contains file, symbol, test, and requirement nodes with typed edges such as `defines`, `imports`, `tests`, and `implements`. A graph snapshot is immutable and identified by a content hash.

### Brownfield reconstruction

Combines extracted symbols, tests, README files, and existing SpecCraft records into candidate requirements. Candidates carry `source`, `confidence`, and `reviewState: "candidate"`. No candidate is approved automatically.

### Drift detection

Compares a stored snapshot with a new scan. It reports added, removed, changed, and stale symbols. Drift is a finding, not an automatic edit.

### Synchronization

Synchronization is event-based. A proposal contains an operation, source evidence, expected revision, and author. Applying a proposal requires the expected revision to match and produces a new revision. Conflicts are rejected, not silently merged.

The local reference implementation provides this contract through `KnowledgeStore`. The HTTP proposal route records pending collaboration proposals; a production persistence adapter must apply approved proposals through the same revision check.

### Multi-agent adapters

All adapters implement:

```text
getProjectSnapshot
getContext
submitProposal
getFindings
```

The adapter receives a scoped project identifier and returns the same JSON contracts. Model-specific prompts are outside the core.

### Remote collaboration

The reference service exposes revisioned HTTP endpoints. Collaboration uses optimistic concurrency, append-only proposal records, and reviewer identity. Production deployment still requires a real identity provider, durable database, audit retention, and rate limiting.

### Security

The local reference service applies:

- repository-root allowlisting
- path traversal protection
- file size and file count limits
- ignored secret and dependency paths
- no shell execution during scanning
- proposal revision checks
- optional bearer-token authentication for HTTP requests
- structured error responses without source-content leakage

Production security additionally requires managed identity, encryption, secret rotation, network controls, dependency scanning, and a threat-model review.

## API contracts

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health |
| `POST` | `/api/scan` | Scan and extract a repository |
| `POST` | `/api/reconstruct` | Produce candidate knowledge |
| `POST` | `/api/drift` | Compare stored and current snapshots |
| `POST` | `/api/context` | Compile task context |
| `POST` | `/api/proposals` | Submit a revisioned proposal |
| `GET` | `/api/findings` | Read current findings |

## Non-goals

The reference implementation is not a hosted SaaS product, does not execute arbitrary repository code, and does not claim semantic understanding from syntax alone. Accuracy must be established with a labelled evaluation set before production use.
