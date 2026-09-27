# Data Model: Correct graph and project observations

## Project

The normalized project retains its current fields and adds normalized shallow copies of:

- `apiContracts: object[]`
- `permissions: object[]`
- `decisions: object[]`

Absent or non-array optional collections normalize to empty arrays, matching `rules` and `workflows`.

## Trace link / knowledge edge

Required: non-empty `from`, `to`, and supported `type`. Optional fields retain the existing knowledge-graph defaults and validation:

- `confidence`: `medium` unless a supported label or 0–1 value is supplied
- `evidence`: empty array unless supplied as an array
- `freshness`: `current` unless explicitly supplied
- `reviewState`: `candidate` unless explicitly supplied

Endpoints must exist in the normalized graph. Duplicate `(from,type,to)` relationships are rejected.

## Repository module observation

Module nodes keep `id: module:<import source>` and `source`. For a relative import resolving to a scanned file, add `resolvedFile` and `external: false`. Package and unresolved imports remain `external: true`.

## Python symbol observation

Python symbol ID becomes `<file>#<name>@<line>`. `name`, `kind`, `file`, `line`, and `evidence` retain their existing meanings. It remains lexical observation data.

## Traversal index (ephemeral)

For a traversal invocation, maps associate node IDs with sorted outgoing and incoming edge lists. They are derived from the graph and are not persisted or exposed.
