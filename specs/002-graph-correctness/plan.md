# Implementation Plan: Correct graph and project observations

**Branch**: `002-graph-correctness` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

## Summary

Correct the existing local graph and parser observations without broadening SpecCraft's semantic claims. Normalize project trace graphs through the established knowledge graph validators, preserve project collections, sort repository traversal before enforcing its cap, resolve only scanned relative JS/TS imports, and make lexical Python declaration IDs unique.

## Technical Context

**Language/Version**: JavaScript ESM, Node.js 20+
**Primary Dependencies**: Existing `@babel/parser`; Node built-ins
**Storage**: In-memory project and graph objects; filesystem scan
**Testing**: `npm test` (Node test runner)
**Target Platform**: Node.js on supported desktop/server platforms
**Project Type**: Local-first library and HTTP reference service
**Performance Goals**: Preserve current scan cap and bounded parser behavior; avoid unnecessary graph work
**Constraints**: No additional dependencies; no source execution; paths stay relative to scanned root
**Scale/Scope**: Existing supported-file cap of 2,000 and per-file cap of 512 KB

## Constitution Check

- Verified behavior first: pass; requirements test current runtime behavior and known limits.
- Evidence and authority: pass; lexical/parser output remains an observation, not canonical intent.
- Specify before implementation: pass; this spec, plan, and tasks precede code edits.
- Preserve brownfield: pass; keep exports, node types, caps, and existing parser choices.
- Verification: pass; add focused tests, run the full suite, and update current-state docs.

## Design Decisions

1. Use `createKnowledgeGraph` to normalize and validate the trace graph. Preserve the existing behavior that synthesizes inferred endpoint nodes for link-only artifacts; reject unsupported relationship types and duplicate links rather than silently constructing invalid graph state.
2. Preserve optional project collections as shallow-copied arrays, matching the existing collection normalization style.
3. Sort each directory's entries with a locale-independent code-point comparator before recursion; this ensures cap selection and revision are stable across filesystem enumeration order.
4. Resolve relative imports by checking the exact specifier, supported JS/TS extensions, and `index` files against the scanned path map. Keep module node IDs stable as `module:<source>` for compatibility; add a `resolvedFile` reference and set `external:false` for resolved imports. Keep package/unresolved nodes external.
5. Give Python lexical symbols line-qualified IDs (`file#name@line`), preserving names and parser output shape while avoiding collisions. Python grammar/scope modeling is not expanded.
6. Optimize graph traversal by building sorted outgoing/incoming adjacency lists once and using a cursor queue; retain existing traversal sort keys, breadth-first order, limits, and path/evidence semantics.

## Data Model

See [data-model.md](data-model.md). No persistence schema changes. Graph edge optional metadata uses the existing defaults from `createKnowledgeEdge`; project model collections include `apiContracts`, `permissions`, and `decisions`.

## Test and Documentation Plan

- Add project model tests for retained collections, metadata defaults, explicit stale state, and malformed/duplicate edge rejection.
- Add scan tests for deterministic cap selection and revision.
- Add code graph tests for local extension/index resolution and unresolved/package imports.
- Add parser tests for repeated Python declarations and deterministic IDs.
- Add traversal equivalence-focused coverage for ordering, cycles, direction, depth/node limits, and metadata propagation.
- Update platform and semantic-graph documentation to distinguish this incremental local behavior from the target unified graph.
- Run `npm test` and `git diff --check`.

## Project Structure

```text
src/
  spec-model.js
  knowledge-graph.js
  repository-platform.js
  code-graph.js
  parser-adapter.js
test/
  spec-model.test.js
  knowledge-graph.test.js
  repository-platform.test.js
  code-graph.test.js
  parser-adapter.test.js
docs/
  platform-specification.md
  semantic-graph-specification.md
  semantic-graph-implementation-plan.md
```

**Structure Decision**: Keep existing root `src/`, `test/`, and `docs/` layout; no directory migration.

## Risks

- Locale-aware ordering can vary by runtime locale; avoid locale comparison for filesystem ordering and use a direct code-point comparator.
- A newly exposed validation error may reject malformed trace links previously traversed permissively; this is intentional, and tests/documentation will state the contract.
- A module node ID based on the import text remains shared by imports from multiple locations; `resolvedFile` records the concrete local target without changing the public ID convention.
- Line-qualified Python IDs are a small identifier format change for consumers of lexical Python observations; document that IDs are opaque stable keys, not semantic names.
