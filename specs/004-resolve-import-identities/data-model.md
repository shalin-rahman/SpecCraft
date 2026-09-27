# Data Model: Resolve local import identities

- Relative module node ID: `module:<importer-path>:<specifier>`.
- Non-relative module node ID: existing `module:<specifier>` convention.
- Direct local edge: `{ from: <importer-file>, to: <resolved-file>, type: "imports", evidence: [<source locations>] }`.
- Existing file-to-module observation edges remain. Unresolved and package modules remain external and have no direct file target.
