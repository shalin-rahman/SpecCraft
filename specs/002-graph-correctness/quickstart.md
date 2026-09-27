# Quickstart: Verify graph and project observation correctness

From the repository root with Node.js 20 or newer:

1. Run `npm test`.
2. Confirm project normalization retains API contracts, permissions, and decisions.
3. Confirm absent edge freshness receives the graph default and explicit stale metadata remains stale.
4. Scan the same fixture repository twice and compare ordered paths and revision.
5. Build a graph containing a relative import, an extensionless/index import, a package import, and an unresolved relative import; verify only scanned relative targets are marked local.
6. Parse a Python fixture with repeated declaration names; verify unique location-qualified IDs and lexical-parser diagnostics.
7. Verify graph traversal still returns the same breadth-first ordering, evidence, and configured limit behavior.

No generated repository source is executed during these checks.
