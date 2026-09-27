# Research: Resolve local import identities

`src/code-graph.js` currently keys all module nodes with raw import text. Relative import text is scoped to the importer by JavaScript/TypeScript resolution rules, so identical text from different directories can point to different files. The graph currently links importers only to module observations, preventing file-level traversal.

Keep module observations for compatibility, but scope relative IDs by importer path and add a direct `imports` edge for resolved scanned files. Repeated source declarations can produce repeated parser observations; merge direct edges by endpoint and retain unique evidence in encounter order. Do not infer aliases or package targets.
