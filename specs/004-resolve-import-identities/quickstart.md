# Quickstart: Verify local import graph paths

Run `npm test`. The graph fixture uses the same `./util` import from two directories, repeats one import declaration, and traverses from each importer to its own target. Verify package and unresolved imports still create external module observations without file-level edges.
