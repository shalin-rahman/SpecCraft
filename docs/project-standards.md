# SpecCraft project standards

## Code

- Use ESM modules and Node.js 20 or newer.
- Keep core behavior configuration-driven.
- Do not hardcode provider URLs, model names, tokens, repository paths, or tenant identifiers.
- Validate external input at the boundary.
- Return structured errors and preserve the original failure reason in safe audit metadata.
- Prefer deterministic operations for scanning, hashing, graph construction, and drift detection.
- Treat repository content as untrusted input.
- Add unit tests for new business logic, including failure and boundary cases.

## Configuration

- Version configuration files.
- Keep local secrets outside the repository.
- Use environment variables only as a local bridge to a managed secret store.
- Reject invalid configuration before serving requests.
- Make provider priority, timeout, retry, and capability choices explicit.

## Evidence and review

- Every inferred result must include source evidence, confidence, and review state.
- Candidate reconstruction never becomes approved knowledge automatically.
- Impact reports use “may need review” language.
- Human approval is required for changes to canonical knowledge.

## Operations

- Record proposals, approvals, provider calls, and permission decisions in an append-only audit stream.
- Apply rate limits before expensive work.
- Use optimistic concurrency for collaboration.
- Use queues and durable storage before enabling repository-scale or remote workloads.
- Publish performance and accuracy measurements with the release.
