# Research: Correct graph and project observations

## Decisions

### Normalize project trace graphs with the existing graph contract

`src/knowledge-graph.js` already owns validation for supported node/relationship types, endpoint presence, duplicate links, confidence, freshness, and review-state defaults. Reuse `createKnowledgeGraph` rather than duplicating or weakening those rules in `src/spec-model.js`.

### Resolve only relative imports backed by the current scan

The scanner is the authority for which source files exist in the observation set. Build a normalized path lookup from `scan.files`; resolve a relative specifier against exact path, known JS/TS extensions, and directory index candidates. Do not inspect package manifests, execute code, follow aliases, or infer package locations. Preserve module IDs and store the resolved file as metadata.

### Use deterministic ordering at the source

Sorting final scan output is insufficient because the file cap truncates traversal early. Sort directory entries before descending, then compute the revision from that ordered list. Use explicit lexical comparison rather than environment-sensitive collation.

### Qualify Python declaration IDs by source location

The fallback parser is line-oriented. Source line is already available and is sufficient to disambiguate supported declarations without pretending to resolve Python scopes. Same-line compound declarations are not supported and remain outside the parser's stated boundary.

### Index traversal adjacency once

The current traversal repeatedly filters and sorts every edge for each visited node and shifts the front of an array queue. Precompute incoming/outgoing lists once in deterministic edge order and advance a queue cursor. Preserve the observable breadth-first result and limits.

## Alternatives considered

- **Merge code and canonical graphs**: out of scope; the docs explicitly describe them as separate today.
- **Full module resolution**: rejected because aliases, package exports, conditions, and language-specific resolution require project configuration and broaden the contract.
- **Python AST dependency**: rejected; this fixes identity collisions without changing the parser's conservative lexical promise.
- **Sort only the returned files**: rejected because it cannot stabilize which files survive the cap.
- **Change traversal relationship semantics**: rejected; graph edge meaning and direction remain caller-defined.
