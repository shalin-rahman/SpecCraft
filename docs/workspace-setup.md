# SpecCraft workspace setup and agent guide

This guide records the verified local setup, current behavior, and the project rules that Codex and other coding agents should follow. It distinguishes the working reference runtime from architectural targets.

## Runtime setup

- Node.js 20 or newer is required by `package.json`. This workspace was checked with Node.js v24.13.1 and npm 11.8.0.
- `package.json` and `package-lock.json` define the JavaScript dependencies; the parser runtime dependency is `@babel/parser`.
- In a fresh checkout, use `npm ci` when the lockfile is present and synchronized, then run `npm test`. `npm ci` removes an existing `node_modules` before installing, so do not use it when preserving a populated working tree matters. For an already initialized checkout, use the installed dependencies and run tests directly.
- The project currently defines `npm test`, `npm run test:unit`, and `npm run platform`. There is no configured lint, type-check, or build command.

## Local commands

Run the test suite:

```powershell
npm test
```

Start the local API:

```powershell
npm run platform
```

The server binds to `127.0.0.1:8787` by default. Set `PORT` to change the port. Set `PLATFORM_REPOSITORY_ROOT` to the exact repository directory the service may scan; the service accepts that directory and its descendants and rejects paths outside it. The service does not execute scanned code.

Example, with the current repository as the only scan root:

```powershell
$env:PLATFORM_REPOSITORY_ROOT = (Get-Location).Path
npm run platform
```

In a second terminal, scan the configured root:

```powershell
$body = @{ root = (Get-Location).Path } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8787/api/scan -Method Post -ContentType "application/json" -Body $body
```

The API supports repository scan, candidate reconstruction, file-hash drift, substring-based repository context, provider health/completion, and pending in-memory proposals. Protected routes accept loopback requests when `PLATFORM_TOKEN` is unset; non-loopback requests need a configured bearer token. Request bodies are limited to 1,000,000 bytes, the default per-peer request limit is 60 per minute, limiter storage is capped at 10,000 buckets, and pending proposals are capped at 1,000 per process. `PROVIDER_CONFIG` supplies provider configuration as JSON text. Keep credentials outside source control; see [the user guide](user-guide.md) and [provider specification](provider-specification.md).

## Verified current state

The current local reference implementation provides:

- requirement validation and analysis, plus separate typed knowledge-graph and review-transition primitives;
- repository scanning with root scoping, ignored secret/dependency paths, file-size/file-count limits, and content hashes;
- Babel-based JavaScript/TypeScript syntax extraction and conservative lexical Python extraction;
- a code graph with file/symbol nodes and observed import, route, test, and limited same-file call edges;
- low-confidence, candidate-only reconstruction per extracted symbol;
- added/removed/changed file hash drift, not semantic specification drift;
- basic graph traversal/coverage and requirement impact helpers, without a unified canonical graph;
- local file-backed and in-memory reference adapters alongside production contracts.
- HS256/RS256 identity verification against an explicit secret or configured HTTPS JWKS URL. The HTTP API does not use this adapter for its own authentication.

The complete suite passed 28 tests on 2026-09-26 after adding identity, request-limit, proposal-capacity, rate-limit, and secret-redaction regressions. The earlier repair pass had 25 passing tests; the initial working-tree run had three failures. Details and the remaining architectural gaps are tracked in [the implementation plan](semantic-graph-implementation-plan.md). Re-run `npm test` for the current checkout; this recorded result is evidence from that date, not a guarantee for future changes.

## Project knowledge and change workflow

Treat the repository as the authority for current behavior, then compare tests, specifications, architecture documents, research material, and plans. Maintain an explicit distinction between current behavior, target behavior, and the gap. Do not present a target document as proof of implementation.

For substantial behavior changes and refactors, use the installed Spec Kit skills and keep the artifacts under `specs/`:

1. Write the user need and acceptance scenarios in `spec.md`.
2. Record the technical approach, affected files, constraints, and verification in `plan.md` and its supporting design files.
3. Turn that plan into ordered, file-specific work in `tasks.md`.
4. Run the cross-artifact analysis before implementation; fix contradictions at the source.
5. Implement the tasks, verify them, and converge the task list with any remaining work.

Small typo fixes and isolated prose edits do not need a feature spec. For behavior changes:

1. Inspect the affected code, its consumers, tests, and governing specification before writing the feature plan.
2. State the intended behavior and compatibility boundary in the artifacts.
3. Make the smallest safe change and add/adjust focused tests.
4. Run `npm test` and review the diff.
5. Update the governing specification and user-facing docs where behavior changed.
6. Keep remaining gaps, uncertainty, and production-only work explicit.

Repository-derived and AI-inferred knowledge remains evidence or a candidate. Human review is required before authoritative knowledge changes. Preserve provenance, confidence, review state, and the source needed to audit a claim. Record contradictions for review; do not silently resolve them.

## Official setup references

- [Codex custom instructions with `AGENTS.md`](https://developers.openai.com/codex/guides/agents-md): project instruction discovery, scope, and layering. Project-level guidance belongs in this repository; global Codex home configuration is separate.
- [OpenAI guidance on keeping `AGENTS.md` useful](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra): keep instructions current and concise, point to relevant docs contextually, and avoid making every task load the whole repository map.
- [npm `ci` documentation](https://docs.npmjs.com/cli/v11/commands/npm-ci/): clean, lockfile-based installation behavior, including removal of an existing `node_modules` directory.
- [Node.js v20 documentation](https://nodejs.org/docs/latest-v20.x/api/): official API reference for the project's minimum supported major version.
- [Node.js ECMAScript modules](https://nodejs.org/docs/latest-v20.x/api/esm.html): module behavior used by this ESM package.
- [Babel parser documentation](https://babel.dev/docs/babel-parser): parser interface and syntax options used for JavaScript and TypeScript extraction.
- [GitHub Spec Kit documentation](https://github.github.com/spec-kit/): the upstream workflow reference. Spec Kit is installed for SpecCraft development; it is not a SpecCraft runtime dependency or provider integration.
- [Spec Kit guide for existing projects](https://github.github.com/spec-kit/guides/existing-projects.html): brownfield adoption guidance. The Codex integration and templates are installed under `.agents/skills/` and `.specify/`.
- [OpenSpec documentation](https://openspec.dev/): current upstream workflow documentation. SpecCraft only stores an example ID named `open-spec`; it does not integrate with OpenSpec yet.
