# Feature Specification: Correct graph and project observations

**Feature Branch**: `002-graph-correctness`
**Created**: 2026-09-26
**Status**: Complete
**Input**: User request to review refactorings and improve correctness in SpecCraft's existing graph, parser, and repository scan behavior.

## User Scenarios & Testing

### User Story 1 - Trust project trace context (Priority: P1)

When a project owner compiles context or checks impact, existing trace links and project records should remain available with their stated evidence and freshness.

**Why this priority**: Incorrect freshness or dropped records can mislead review and impact decisions.

**Independent Test**: Build a project with API, permission, and decision records and trace links with explicit metadata; compile context and verify the records and metadata survive.

**Acceptance Scenarios**:
1. **Given** a valid project with API, permission, and decision entries, **When** it is normalized, **Then** those collections are retained.
2. **Given** a trace link with omitted freshness and review metadata, **When** project impact is traversed, **Then** graph defaults are applied and the path is current.
3. **Given** a trace link with explicit stale freshness, **When** traversed, **Then** the result remains stale.

### User Story 2 - Get repeatable repository observations (Priority: P1)

When the same repository is scanned and graphed, the same supported files and local relationships should be selected in a stable order; resolvable relative imports should point to repository files.

**Why this priority**: Stable observations support meaningful revisions and trustworthy navigation.

**Independent Test**: Use temporary repositories with shuffled file creation order, a relative module import, and more than the configured scan cap; compare selected files and revisions.

**Acceptance Scenarios**:
1. **Given** a repository with more supported files than the scan cap, **When** scanned repeatedly, **Then** the same lexically ordered subset and revision are returned.
2. **Given** a relative JavaScript or TypeScript import resolving to a scanned file, **When** a code graph is built, **Then** the import edge targets that file-backed module and it is not marked external.
3. **Given** a package or unresolved import, **When** graphed, **Then** it remains an external module observation.

### User Story 3 - Distinguish Python declarations (Priority: P2)

When lexical Python extraction encounters repeated names in different scopes or at different locations, each observation should have a stable unique identity while retaining its human-readable name and conservative limitations.

**Why this priority**: Colliding IDs silently overwrite parser observations in downstream graph maps.

**Independent Test**: Parse a Python file with repeated names and confirm each declaration has a distinct deterministic ID and source line.

**Acceptance Scenarios**:
1. **Given** repeated Python declaration names, **When** parsed, **Then** every declaration has a unique ID and accurate file/line evidence.
2. **Given** identical input parsed twice, **When** compared, **Then** symbol IDs and ordering match.

## Edge Cases

- Relative imports with extension omission or directory index files resolve only when a matching scanned file exists.
- Absolute/package imports are never treated as local paths.
- Symlinks and paths escaping the scan root are not newly followed.
- Scan caps apply after deterministic path ordering.
- Explicit stale metadata is preserved; defaults apply only when metadata is absent.
- Python declarations on the same line are outside the lexical extractor's supported syntax and must not be falsely claimed as parsed.

## Requirements

### Functional Requirements

- **FR-001**: Project normalization MUST preserve supported API contract, permission, and decision collections.
- **FR-002**: Project trace graphs MUST represent missing link endpoints as inferred observation nodes and validate relationship types, duplicate links, and optional metadata using the existing knowledge graph contract.
- **FR-003**: The trace graph MUST preserve explicit edge metadata and use documented graph defaults when optional metadata is omitted.
- **FR-004**: Repository scanning MUST sort directory entries deterministically before applying the file cap.
- **FR-005**: The code graph MUST resolve relative JavaScript/TypeScript imports against scanned files for the documented extension and index candidates, and mark only unresolved/package imports external.
- **FR-006**: Python declaration IDs MUST be unique and deterministic for repeated names while retaining the existing lexical-parser diagnostic.
- **FR-007**: Existing public node types, traversal order, scan caps, and non-relative import behavior MUST remain compatible.
- **FR-008**: Tests and documentation MUST describe the implemented behavior and parser/scanner limitations.
- **FR-009**: Graph traversal MUST avoid rescanning the complete edge collection for every visited node while preserving deterministic breadth-first order, direction, limits, paths, and metadata.

### Key Entities

- **Project**: Named/versioned SpecCraft input retaining requirements, rules, workflows, API contracts, permissions, decisions, and trace links.
- **Trace link**: Typed relationship between project artifact IDs, including optional confidence, evidence, freshness, and review state.
- **Repository observation**: Supported source file and parser observation identified by normalized path, declaration location, and content revision.

## Success Criteria

- **SC-001**: All supported project collections and trace-link metadata survive normalization and traversal in focused regression cases.
- **SC-002**: Repeated scans of a fixture repository return byte-for-byte identical ordered paths and revision, including at the file cap.
- **SC-003**: Every resolvable fixture relative import points to a repository-backed module; package imports remain external.
- **SC-004**: Repeated Python declarations produce no duplicate symbol IDs and retain correct line evidence.
- **SC-005**: The complete `npm test` suite passes after the changes.
- **SC-006**: Traversal regression tests confirm identical ordering and path/evidence/freshness semantics for existing graph cases while adjacency is indexed once per traversal.

## Assumptions

- Supported import resolution is intentionally limited to relative JavaScript/TypeScript imports and scanned files.
- Python remains lexical; this feature does not add an AST dependency or claim semantic scope resolution.
- The existing 2,000-file scan cap remains unchanged; only which files are chosen becomes deterministic.
- Graph traversal semantics and broader unification of repository and canonical knowledge graphs remain out of scope.
