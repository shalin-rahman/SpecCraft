# Graph Report - C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft  (2026-09-25)

## Corpus Check
- 6 files · ~374,025 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 43 nodes · 49 edges · 10 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `walk()` - 4 edges
2. `scanRepository()` - 4 edges
3. `requireText()` - 4 edges
4. `ensureRepositoryRoot()` - 3 edges
5. `hash()` - 3 edges
6. `renderProjectSummary()` - 2 edges
7. `lineNumber()` - 2 edges
8. `extractSymbols()` - 2 edges
9. `parsePathRoot()` - 2 edges
10. `languageFor()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `renderProjectSummary()` --calls--> `summarizeProject()`  [INFERRED]
  C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\app.js → C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\spec-model.js

## Communities

### Community 0 - "Community 0"

Cohesion: 0.33
Nodes (5): ignoredDirectories, ignoredFiles, maxFileBytes, maxFiles, supportedExtensions

### Community 1 - "Community 1"

Cohesion: 0.33
Nodes (5): context, findings, impact, project, requirement

### Community 2 - "Community 2"

Cohesion: 0.4
Nodes (3): demoProject, renderProjectSummary(), summarizeProject()

### Community 3 - "Community 3"

Cohesion: 0.5
Nodes (3): extractSymbols(), lineNumber(), symbolPatterns

### Community 4 - "Community 4"

Cohesion: 0.4
Nodes (3): ambiguousTerms, validPriorities, validStatuses

### Community 5 - "Community 5"

Cohesion: 0.5
Nodes (3): navLinks, target, targetId

### Community 6 - "Community 6"

Cohesion: 0.67
Nodes (4): hash(), languageFor(), scanRepository(), walk()

### Community 7 - "Community 7"

Cohesion: 0.5
Nodes (4): createRequirement(), createSpecProject(), createTraceLink(), requireText()

### Community 8 - "Community 8"

Cohesion: 1.0
Nodes (2): ensureRepositoryRoot(), parsePathRoot()

### Community 9 - "Community 9"

Cohesion: 1.0
Nodes (2): analyzeRequirement(), compileContext()

## Knowledge Gaps
- **18 isolated node(s):** `navLinks`, `targetId`, `target`, `demoProject`, `symbolPatterns` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (2 nodes): `ensureRepositoryRoot()`, `parsePathRoot()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `analyzeRequirement()`, `compileContext()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.