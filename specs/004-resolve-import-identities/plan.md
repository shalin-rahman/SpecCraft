# Implementation Plan: Resolve local import identities

**Branch**: `004-resolve-import-identities` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

## Summary

Scope relative module observation IDs to their importing file and add direct import edges to the resolved scanned file, while retaining existing module observation nodes and external package/unresolved imports.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+
**Primary Dependencies**: Existing Babel parser and Node built-ins
**Storage**: In-memory code graph
**Testing**: `npm test`
**Project Type**: Local-first analysis library
**Constraints**: Do not broaden resolution beyond Feature 002's scanned-path candidates; preserve source evidence and current unresolved import semantics.

## Constitution Check

- Verified behavior first: pass; importer-specific fixtures exercise actual graph paths.
- Brownfield preservation: pass; keep external module observations and edge type vocabulary.
- Evidence and uncertainty: pass; only resolved scan files receive direct edges.
- Verification: pass; write regression tests before source edits and run all tests.

## Design

1. Keep `module:<specifier>` for non-relative imports. For relative imports use `module:<importer-path>:<specifier>`; this scopes module metadata without changing package module IDs.
2. Keep the existing importer-to-module `imports` edge and evidence.
3. For resolved relative imports, add a direct importer-file-to-target-file `imports` edge with the same source-line evidence. Deduplicate edges by importer and target when repeated statements resolve to the same dependency; merge their evidence deterministically.
4. Unresolved and package imports produce no direct file edge.

## Test Plan

- Same `./util` specifier in two directories resolves to two separate nodes/targets.
- Traversal from each importer reaches only its own target through a direct import edge.
- Repeated statements in one importer do not duplicate the file relationship; evidence retains each line.
- Existing external import behavior stays intact.

## Project Structure

```text
src/code-graph.js
test/code-graph.test.js
docs/platform-specification.md
docs/semantic-graph-implementation-plan.md
```

**Structure Decision**: Extend the existing parser-driven code graph in place.
