# Feature Specification: Resolve local import identities

**Feature Branch**: `004-resolve-import-identities`
**Created**: 2026-09-26
**Status**: Complete

## User Scenarios & Testing

### User Story 1 - Follow local imports to their files (Priority: P1)

When a user inspects a code graph, a local import should lead from its importing file to the actual scanned dependency file, including when the same relative specifier appears in different directories.

**Why this priority**: Context, impact, and trace traversal need concrete source-file relationships; a detached module observation cannot provide file-level navigation.

**Independent Test**: Scan two directory trees that each contain a file importing `./util`; verify each import resolves to its own local file and graph traversal reaches those target files.

**Acceptance Scenarios**:
1. **Given** two importers in different directories with the same relative specifier, **When** the graph is built, **Then** each specifier observation has an identity tied to its importer and its own resolved target.
2. **Given** a resolvable relative import, **When** traversing from its importer, **Then** the target file node is reachable through an `imports` relationship.
3. **Given** a package or unresolved import, **When** graphed, **Then** it remains an external module observation without a fabricated file target.

## Edge Cases

- Repeated imports from one file to the same target must not create duplicate graph relationships.
- The same raw relative specifier resolving to different files must not merge metadata or become falsely external.
- Import paths must remain limited to the scan inventory and must not follow aliases or execute code.

## Requirements

### Functional Requirements

- **FR-001**: Relative module observations MUST have identities that distinguish importers when the same text can resolve to different files.
- **FR-002**: A resolvable relative import MUST create a direct `imports` relationship from importer file to resolved scanned file.
- **FR-003**: Package and unresolved import observations MUST remain external and MUST NOT create file targets.
- **FR-004**: Existing import module observations and source evidence MUST remain available for consumers.
- **FR-005**: Graph construction MUST avoid duplicate direct import relationships for repeated identical imports in one file.

### Key Entities

- **Importer file**: Scanned source file containing the import declaration.
- **Module observation**: Import source text scoped to its importer when relative, with an optional resolved scanned path.
- **Import relationship**: Graph edge connecting an importer file to its local dependency file or module observation.

## Success Criteria

- **SC-001**: Two files using the same relative import text resolve to the correct distinct targets.
- **SC-002**: A bounded graph traversal from each importer can reach its resolved target file.
- **SC-003**: Package/unresolved module observations remain external and have no fabricated file edge.
- **SC-004**: The full `npm test` suite passes.

## Assumptions

- Resolution candidates and supported extensions remain as specified in Feature 002.
- Direct file-level import edges supplement existing module observations; module nodes remain available for compatibility.
- This feature does not add project alias or package export resolution.
