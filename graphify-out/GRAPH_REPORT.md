# Graph Report - C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft  (2026-09-27)

## Corpus Check
- 26 files · ~548,659 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 370 nodes · 452 edges · 19 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]

## God Nodes (most connected - your core abstractions)
1. `FileJobQueue` - 10 edges
2. `ProjectRepository` - 10 edges
3. `ManagedDatabaseAdapter` - 8 edges
4. `buildCodeGraph()` - 7 edges
5. `VaultSecretProvider` - 7 edges
6. `traverseKnowledgeGraph()` - 6 edges
7. `PlatformAdapter` - 6 edges
8. `digest()` - 6 edges
9. `decodeJsonWebToken()` - 5 edges
10. `DurableAuditLog` - 5 edges

## Surprising Connections (you probably didn't know these)
- `analyzeRepository()` --calls--> `buildCodeGraph()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\platform-services.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\code-graph.js
- `safeTokenMatches()` --calls--> `digest()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\platform-http.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\production-infrastructure.js
- `hash()` --calls--> `digest()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\repository-platform.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\production-infrastructure.js
- `renderProjectSummary()` --calls--> `summarizeProject()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\app.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\spec-model.js
- `runRepositoryBenchmark()` --calls--> `analyzeRepository()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\benchmark.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\platform-services.js

## Communities

### Community 0 - "Community 0"

Cohesion: 0.03
Nodes (64): attempts, authz, claimed, claims, collaborationPath, credential, currentLease, customRule (+56 more)

### Community 1 - "Community 1"

Cohesion: 0.06
Nodes (16): safeTokenMatches(), base64UrlDecode(), createVerifiedPrincipal(), decodeJsonWebToken(), digest(), DurableAuditLog, EnvironmentSecretManager, EnvironmentSecretProvider (+8 more)

### Community 2 - "Community 2"

Cohesion: 0.08
Nodes (30): demoProject, renderProjectSummary(), asConfidence(), confidenceRank(), confidenceValue(), createKnowledgeEdge(), createKnowledgeGraph(), createKnowledgeNode() (+22 more)

### Community 3 - "Community 3"

Cohesion: 0.06
Nodes (29): address, allowed, baseUrl, candidates, context, crossDrive, drift, findings (+21 more)

### Community 4 - "Community 4"

Cohesion: 0.13
Nodes (4): FileJobQueue, ManagedOutbox, persistAtomically(), ProjectRepository

### Community 5 - "Community 5"

Cohesion: 0.11
Nodes (19): body(), createPlatformServer(), DEFAULT_MAX_BODY_BYTES, DEFAULT_MAX_PROPOSALS, DEFAULT_RATE_LIMIT, DEFAULT_RATE_LIMIT_BUCKETS, DEFAULT_RATE_WINDOW_MS, httpError() (+11 more)

### Community 6 - "Community 6"

Cohesion: 0.13
Nodes (12): buildCodeGraph(), extractSymbols(), isTestFile(), moduleNodeId(), resolveScannedImport(), sourceExtensions, commonResult(), createDefaultParserRegistry() (+4 more)

### Community 7 - "Community 7"

Cohesion: 0.1
Nodes (5): AuditLog, RateLimiter, DistributedRateLimiter, SecretManager, VaultSecretProvider

### Community 8 - "Community 8"

Cohesion: 0.12
Nodes (13): runRepositoryBenchmark(), analyzeRepository(), ensureRepositoryRoot(), hash(), ignoredDirectories, ignoredFiles, languageFor(), maxFileBytes (+5 more)

### Community 9 - "Community 9"

Cohesion: 0.14
Nodes (7): PlatformAdapter, context, findings, impact, project, requirement, unsupported

### Community 10 - "Community 10"
_Handles the lifecycle and metadata of test cases—from candidate, review, approval, to acceptance—tracking coverage metrics, execution results, and related graph data._
Cohesion: 0.18
Nodes (10): accepted, approved, candidate, canonical, coverage, graph, inReview, proposed (+2 more)

### Community 11 - "Community 11"
_Handles traversal state, candidate detection, and symbol resolution in static code analysis._
Cohesion: 0.18
Nodes (10): analysis, candidates, context, current, drift, first, previous, root (+2 more)

### Community 12 - "Community 12"

Cohesion: 0.22
Nodes (8): file, first, javascript, python, registry, second, typescript, unsupported

### Community 13 - "Community 13"

Cohesion: 0.25
Nodes (7): audit, calls, config, limiter, result, router, validated

### Community 14 - "Community 14"
_Handles persistence and retrieval of knowledge artifacts while detecting and managing revision conflicts during updates._
Cohesion: 0.33
Nodes (2): KnowledgeStore, RevisionConflictError

### Community 15 - "Community 15"
_Handles representation and normalization of module dependencies as a directed graph._
Cohesion: 0.33
Nodes (5): directEdges, graph, moduleNodes, modules, normalized

### Community 16 - "Community 16"

Cohesion: 0.33
Nodes (5): first, index, name, root, second

### Community 17 - "Community 17"

Cohesion: 0.5
Nodes (3): navLinks, target, targetId

### Community 18 - "Community 18"
_Manages network communication by handling server lifecycle and port assignments._
Cohesion: 0.67
Nodes (2): port, server

## Knowledge Gaps
- **169 isolated node(s):** `navLinks`, `targetId`, `target`, `demoProject`, `sourceExtensions` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.