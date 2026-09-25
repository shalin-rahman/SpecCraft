<!-- converted from SpecCraft_Product_Specification_v1.0.docx -->

SpecCraft â€” Agent-Independent Specification & Engineering Knowledge Platform
Version 1.0 â€¢ 25 September 2026
Reference architecture and implementation specification

# 1. Executive Summary
SpecCraft is a generic, agent-independent specification and engineering-knowledge layer for AI-assisted software development. It does not attempt to replace coding agents such as Codex, Claude Code, Copilot, Cursor, Kiro, Gemini-based agents, or Spec Kit. Instead, it provides persistent, versioned, structured, evidence-backed project knowledge that those agents can query and update.
The central design principle is: the agent is the reasoning and implementation engine; SpecCraft is the durable specification, traceability, validation, synchronization, and context layer.
- Greenfield: human intent â†’ clarified requirements â†’ canonical specification â†’ agent implementation â†’ verification.
- Brownfield: existing code/tests/configuration â†’ reverse engineering â†’ reconstructed specification â†’ human review â†’ maintained specification.
- Convergence: specification + implementation â†’ drift analysis â†’ gaps/undocumented behavior â†’ remediation tasks.
- Agent portability: the same project specification is accessible from different agents, models, editors, CLI sessions, and CI.
- Token efficiency: agents receive task-relevant context through a context compiler instead of the entire project specification.
# 2. Product Positioning and Scope
Product statement: â€œA persistent specification and engineering knowledge layer that gives every AI coding agent the same authoritative, versioned, evidence-backed understanding of a software project.â€
## 2.1 In scope
- Natural-language requirement capture and normalization.
- Clarification and ambiguity/contradiction discovery through agents.
- Canonical machine-readable specification model.
- Requirements, rules, actors, entities, workflows, APIs, constraints, tests, decisions, architecture, glossary, and traceability.
- Specification review and improvement against existing specifications.
- Code-to-spec reverse engineering and evidence capture.
- Current implementation review against specifications.
- Specification drift and undocumented-behavior detection.
- Impact analysis.
- Agent/editor interoperability through MCP, CLI, REST/API, and repository-local files.
- Context compilation and task-scoped context retrieval.
- Git-native versioning and optional team/cloud synchronization.
- Adapters for Spec Kit and other SDD/agent workflows.
## 2.2 Out of scope for v1
- Becoming a general-purpose coding agent.
- Replacing Git/GitHub/GitLab.
- Replacing IDEs.
- Owning proprietary model inference.
- Forcing a single LLM vendor.
- Automatically accepting inferred business rules without human approval.
- Building a proprietary code graph if an adequate external code-graph integration can be consumed.
# 3. Design Principles

# 4. Conceptual Architecture
Human / Product Owner / Developer
            |
            v
     Agent / IDE / Chat
            |
       MCP / CLI / API
            |
            v
+----------------------------------------------+
|              SpecCraft Core                  |
| Requirements | Rules | Workflows | Entities |
| APIs | Tests | Decisions | Architecture      |
| Traceability | Evidence | Versioning        |
| Validation | Impact | Drift | Context       |
+---------------------+------------------------+
                      |
          +-----------+-----------+
          |                       |
      Git/Files               Knowledge DB
          |                       |
          +-----------+-----------+
                      |
                Code Graph Adapter
                      |
              Existing Repository
## 4.1 Architectural style
- Modular monolith for initial product; extract services only when scaling, isolation, or deployment boundaries justify it.
- Hexagonal architecture / ports and adapters.
- Domain-driven design for specification concepts and bounded contexts.
- CQRS where read/query workloads and mutation workflows differ materially.
- Event-driven internal domain events for auditability and synchronization.
- Repository pattern only behind domain/application ports; avoid generic repositories that hide domain intent.
- Unit of Work where multi-aggregate transactional consistency is required.
- Specification pattern for deterministic rule predicates and reusable validation.
- Strategy/Adapter pattern for LLM providers, agents, code analyzers, graph providers, and export targets.
- Outbox pattern for reliable asynchronous integration events.
- Idempotent commands and deterministic synchronization.
# 5. Canonical Specification Model
The canonical model is the product's most important contract. It must be independent of Spec Kit, any LLM, and any editor.
## 5.1 Core objects

## 5.2 Requirement schema â€” conceptual
Requirement {
  id: stable-id
  title
  statement
  rationale
  type: functional | non-functional | constraint | integration | compliance
  priority
  status: proposed | approved | deprecated | rejected
  actors[]
  preconditions[]
  postconditions[]
  acceptanceCriteria[]
  relatedRules[]
  relatedWorkflows[]
  relatedEntities[]
  evidence[]
  traceLinks[]
  source: human | imported | inferred | reverse-engineered
  confidence
  version
}
# 6. Agent Responsibilities vs Platform Responsibilities

# 7. Core Functional Requirements

# 8. Specification Review and Improvement Engine
The system must treat an existing specification as an artifact to review, not a blank document to replace.
- Parse existing Markdown, YAML, JSON, OpenAPI, UML/diagram exports, tickets, ADRs, requirements documents and Spec Kit artifacts.
- Normalize concepts into the canonical model while preserving original source references.
- Detect duplicate requirements and semantically overlapping statements.
- Detect vague terms such as 'fast', 'secure', 'appropriate', 'etc.', 'user-friendly' when they lack measurable criteria.
- Detect missing acceptance criteria, actors, authorization, failure paths, lifecycle states, audit requirements, data ownership and retention.
- Detect contradictions within the same document and across documents.
- Detect stale references to removed APIs, entities, workflows, or technologies.
- Suggest improvements as review findings; do not silently rewrite approved content.
- Allow each finding to be accepted, rejected, deferred, or converted into a clarification question.
- Preserve before/after diff and rationale for accepted improvements.
# 9. Reverse Engineering Existing Systems
Repository
  -> inventory
  -> parse/build dependency graph
  -> detect architecture boundaries
  -> inspect APIs / DB / configuration / tests
  -> extract runtime/static behavior
  -> infer candidate requirements
  -> attach evidence + confidence
  -> human review
  -> approved canonical specification
- Support common source languages through pluggable analyzers.
- Use AST/static analysis where possible; use LLM interpretation only for semantic gaps.
- Integrate external code knowledge graph providers such as Graphify rather than requiring a proprietary graph engine in v1.
- Analyze controllers/routes, services, domain objects, repositories, database schemas/migrations, tests, configuration, event handlers and CI.
- Optionally ingest Git history to identify behavior changes and historical rationale.
- Never label inferred behavior as an approved requirement without review.
- Record confidence and exact evidence for every inferred fact.
# 10. Current Implementation Synchronization
This feature closes the loop between specification and current implementation.
## 10.1 Comparison dimensions
- Requirement coverage: approved requirements with no implementation evidence.
- Rule coverage: rules not enforced or enforced differently.
- Workflow coverage: missing states/transitions/guards/side effects.
- API coverage: missing endpoints, wrong schemas, authorization gaps, compatibility issues.
- Data coverage: missing fields, constraints, relationships, lifecycle handling.
- Test coverage: acceptance criteria without corresponding tests.
- Undocumented behavior: meaningful code behavior with no corresponding specification.
- Specification drift: code behavior contradicts an approved requirement.
- Stale specification: specification references code/API/domain elements that no longer exist.
## 10.2 Synchronization outcomes

# 11. Agent/Model/Editor Synchronization
- Canonical specification is repository-local and versioned independently of agent conversation history.
- MCP exposes query/mutation capabilities to compatible agents.
- A generated project instruction file explains how agents must interact with SpecCraft.
- Agent-specific files such as AGENTS.md, CLAUDE.md or editor-specific rules are generated from the same canonical project policy.
- Only one canonical project model exists; agent-specific context is a projection.
- Session memory is not authoritative project state.
- All material agent changes are submitted as typed changesets that can be reviewed and committed.
- Use optimistic concurrency/version checks to prevent two agents from overwriting one another.
- Use Git merge/rebase for repository-local conflicts and semantic merge tooling for specification conflicts.
- Cloud synchronization is optional; local Git remains the portability baseline.
# 12. MCP Interface
## 12.1 Read tools
- spec.project.get
- spec.search
- spec.requirement.get
- spec.rule.get
- spec.workflow.get
- spec.entity.get
- spec.api.get
- spec.tests.get
- spec.trace.query
- spec.evidence.get
- spec.impact.analyze
- spec.context.build
- spec.review.get
## 12.2 Mutation tools
- spec.requirement.propose
- spec.clarification.create
- spec.clarification.answer
- spec.change.create
- spec.change.review
- spec.evidence.attach
- spec.finding.resolve
- spec.sync.run
- spec.verify.run
Mutation tools must support dry-run, validation, authorization, idempotency keys, provenance, and human-approval status where required.
# 13. CLI
SpecCraft init
SpecCraft capture
SpecCraft clarify
SpecCraft review
SpecCraft validate
SpecCraft reverse
SpecCraft sync
SpecCraft impact
SpecCraft context
SpecCraft verify
SpecCraft export --target speckit
SpecCraft import --source speckit
SpecCraft doctor
SpecCraft status
# 14. Spec Kit Integration
SpecCraft should use Spec Kit as an adapter/execution workflow rather than fork its core. Current Spec Kit is explicitly an extensible process harness with Specify â†’ Plan â†’ Tasks â†’ Implement â†’ Converge, many agent integrations, workflows, extensions and presets. Spec Kit's existing-project guide also makes clear that initializing an existing repository does not infer its specifications automatically. This creates a useful complementary boundary for SpecCraft's reverse-engineering capability.
- Generate Spec Kit-compatible artifacts from canonical requirements.
- Import Spec Kit artifacts into canonical objects with provenance.
- Track Spec Kit version and adapter version.
- Avoid depending on private Spec Kit internals.
- Use versioned adapter contracts and compatibility tests.
- Allow users to use SpecCraft without Spec Kit.
# 15. External Tool Integrations

# 16. Persistence and Data Architecture
- Repository-local canonical files: human-readable YAML/JSON/Markdown with stable IDs.
- Optional PostgreSQL service for indexed search, collaboration, audit, and team-scale queries.
- Optional graph database only when graph workloads exceed relational recursive-query needs.
- Object storage for large evidence artifacts.
- Vector search is optional and supplementary; semantic retrieval must never replace canonical structured relationships.
- Every persisted object has stable ID, version, created/updated metadata, status, provenance, and checksum where appropriate.
# 17. Security Requirements
- Never expose secrets from environment/configuration to an LLM by default.
- Treat repository contents and agent outputs as untrusted input.
- Sandbox code execution and workflow shell commands.
- Use least-privilege credentials and short-lived tokens.
- Require explicit consent before network access or destructive commands.
- Redact secrets and sensitive values from evidence/context.
- Audit all tool calls that mutate specifications or execute code.
- Support local-only mode for sensitive repositories.
- Tenant isolation and encryption at rest/in transit for cloud mode.
- Prompt-injection resistance: repository text, comments, docs and generated code must not be treated as trusted instructions.
# 18. Quality Attributes / Non-Functional Requirements

# 19. Development Standards and Practices
- SOLID and clean/hexagonal architecture.
- DDD bounded contexts: Specification, Review, Traceability, Synchronization, Analysis, Integration, Identity.
- ADR for material architecture decisions.
- Semantic Versioning for public APIs, schema, adapters and integrations.
- OpenAPI for HTTP APIs; JSON Schema for canonical file contracts.
- Contract-first API development.
- Conventional commits or equivalent structured commit policy.
- Trunk-based development or short-lived branches; protected main branch.
- Mandatory code review for production changes.
- Automated linting, formatting, static analysis and dependency scanning.
- SAST, secret scanning, dependency/SBOM generation and license checks.
- Property-based testing for parsers/validators where valuable.
- Golden/snapshot tests for context compilation and generated artifacts.
- Fixture repositories for reverse-engineering regression tests.
- Mutation testing for critical deterministic validation rules where practical.
- No business-critical behavior may depend solely on probabilistic model output.
- Feature flags for experimental integrations.
- Backward-compatible schema migrations with explicit migration tooling.
# 20. Testing Strategy

# 21. CI/CD Quality Gates
- Build and unit tests must pass.
- Schema compatibility check.
- Generated artifact drift check.
- Security and secret scan.
- Dependency vulnerability/license checks.
- Integration contract tests.
- Specification verification for changed scope.
- No unresolved blocking specification findings.
- Adapter compatibility matrix for supported Spec Kit/agent versions.
# 22. Synchronization Algorithm
1. Load canonical specification version N.
2. Load repository commit/worktree state.
3. Incrementally analyze changed files plus impacted dependencies.
4. Resolve code/spec trace links.
5. Re-evaluate affected requirements/rules/workflows/tests.
6. Produce findings with evidence and confidence.
7. Classify findings:
   covered / partial / missing / contradiction / undocumented / stale / unverifiable.
8. Build a proposed change set.
9. Require human approval for semantic/specification changes.
10. Persist approved change set as version N+1.
11. Regenerate agent/editor context projections.
12. Optionally export updated Spec Kit artifacts.
# 23. Context Compiler
- Input: task/requirement/code location/question.
- Retrieve only relevant requirements, rules, workflow paths, entities, APIs, tests, decisions and code evidence.
- Rank structured links before semantic similarity.
- Apply token budget and context priority policies.
- Produce a deterministic context manifest listing every included source.
- Allow agents to request more context explicitly.
- Never hide conflicts: unresolved findings relevant to the task must be surfaced.
# 24. Agent Portability Contract
SpecCraft PROJECT CONTRACT

- .spec/ is the canonical project knowledge layer.
- Agent-specific instruction files are generated projections.
- Agents must query the specification before inventing business behavior.
- Material specification changes require a changeset.
- Code changes affecting behavior should run spec verification.
- Session history is not authoritative.
- Any agent may be replaced without losing project knowledge.
- Generate AGENTS.md, CLAUDE.md, editor rules, Spec Kit command/context files as needed.
- Track generated-file provenance so manual modifications are detected.
- Regenerate projections safely after agent/model/editor changes.
- Use a capability registry to adapt to agents with/without MCP, filesystem, terminal, or custom commands.
# 25. Review Workflow
Existing Spec
   -> Parse
   -> Normalize
   -> Analyze
   -> Findings
   -> Human review
   -> Approved changes
   -> Versioned canonical Spec

Current Code
   -> Analyze
   -> Evidence
   -> Compare with Spec
   -> Findings
   -> Human/Agent remediation
   -> Verify
# 26. Recommended Implementation Roadmap

# 27. MVP Acceptance Criteria
- A user can initialize a project and store a canonical specification in Git.
- An AI agent can query requirements through MCP.
- Two different agents can work on the same repository without sharing conversation history and still retrieve the same approved requirements.
- An existing specification can be reviewed and produce actionable findings.
- An existing codebase can be analyzed to produce candidate requirements with source evidence.
- The system can compare approved specification with current implementation and identify at least missing, partial, contradictory and undocumented behavior.
- A task-scoped context can be generated within a configurable token budget.
- Spec Kit artifacts can be generated/imported without making Spec Kit a hard dependency.
- All material specification changes are versioned and auditable.
- A local-only installation works without mandatory cloud services.
# 28. Risks and Mitigations

# 29. Reference Technology Stack
- Reference implementation: TypeScript/Node.js for CLI, MCP and integration layer; use a strongly typed domain model.
- PostgreSQL for optional server-side persistence/indexing.
- JSON Schema + YAML/JSON for canonical repository artifacts.
- Git/libgit2 or native Git CLI adapter.
- Tree-sitter/Language Server Protocol/AST adapters where suitable for code analysis.
- OpenTelemetry for observability.
- OpenAPI for HTTP API contracts.
- MCP for agent interoperability.
- Optional Graphify or equivalent code graph provider.
- Provider abstraction for OpenAI, Anthropic, Gemini, local models and future providers.
- Docker for reproducible local/server deployment.
Technology choices are implementation recommendations, not requirements of the domain model. The architecture must preserve provider and editor independence.
# 30. Reference Sources Reviewed
- GitHub Spec Kit documentation: https://github.com/github/spec-kit
- Spec Kit documentation: https://github.github.com/spec-kit/
- Spec Kit existing-project guide: https://github.com/github/spec-kit/blob/main/docs/guides/existing-projects.md
- Spec Kit workflows reference: https://github.com/github/spec-kit/blob/main/docs/reference/workflows.md
- Spec Kit integrations reference: https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md
- Spec Kit customization guide: https://github.com/github/spec-kit/blob/main/docs/guides/customization.md
End of Product Specification â€” v1.0
| Principle | Requirement |
| --- | --- |
| Specification as source of intent | Approved requirements and decisions are authoritative for intended behavior. |
| Code as evidence of behavior | Existing code is evidence; it is not automatically treated as the desired specification. |
| Human agency and approval | AI may propose/infer; humans approve material business rules and architectural decisions. |
| Agent independence | No dependency on a single model, editor, agent, or vendor. |
| Git-native portability | Core project knowledge must be exportable and versionable with the repository. |
| Deterministic where possible | Use schemas, graph algorithms, state validation, policy engines, and static analysis instead of LLM-only judgments. |
| Evidence-backed inference | Every reverse-engineered or inferred fact stores provenance, confidence, and evidence locations. |
| Least context | Only task-relevant context should be supplied to agents. |
| Secure by default | Secrets, credentials, PII, and unsafe execution are never exposed to agents unless explicitly authorized. |
| Open interfaces | MCP, OpenAPI, JSON Schema, Git, and standard file formats are first-class integration surfaces. |
| Object | Purpose |
| --- | --- |
| Project | Identity, configuration, repositories, integrations, policies. |
| Requirement | A desired capability or behavior with lifecycle/status. |
| Actor | Human, role, system, external organization, or automated actor. |
| Entity | Business/domain object and its lifecycle. |
| Business Rule | Normative condition, constraint, calculation, authorization, or invariant. |
| Workflow | State machine/process including states, transitions, guards and side effects. |
| API Contract | Input/output behavior, authorization, errors and compatibility constraints. |
| Data Contract | Schema, validation, relationships, lifecycle and retention. |
| Acceptance Criterion | Verifiable statement derived from requirements. |
| Test Specification | Test intent, data, expected outcome and traceability. |
| Architecture Decision | Decision, alternatives, rationale, consequences and status. |
| Decision | Human-approved clarification or project policy. |
| Evidence | Source material supporting an assertion. |
| Trace Link | Typed relationship between specification, code, tests, docs, commits, APIs, etc. |
| Finding | Ambiguity, contradiction, drift, undocumented behavior, missing test, or quality issue. |
| Change Set | A versioned collection of specification changes with review state. |
| Capability | Agent | SpecCraft |
| --- | --- | --- |
| Understand natural language | Primary | Provides schema/context |
| Ask clarification questions | Primary | Stores answers and decisions |
| Propose requirements | Primary | Validates structure |
| Explain trade-offs | Primary | Provides evidence/context |
| Persist canonical specification | No | Primary |
| Versioning | No | Primary/Git |
| Deterministic validation | Limited | Primary |
| Workflow/state validation | Limited | Primary |
| Traceability graph | No | Primary |
| Impact analysis | Assisted | Primary |
| Code analysis | Uses tools | Orchestrates/adapts |
| Reverse engineering | Interprets | Coordinates + persists evidence |
| Context generation | Consumes | Primary |
| Implementation | Primary | Verifies |
| Final business approval | No | Human-controlled |
| ID | Capability | Requirement |
| --- | --- | --- |
| FR-001 | Project initialization | Create or attach a SpecCraft project to a repository without rewriting application code. |
| FR-002 | Natural-language capture | Accept free-form requirements from UI, CLI, API, or agent. |
| FR-003 | Clarification | Generate and track clarification questions for missing/ambiguous information. |
| FR-004 | Canonicalization | Convert accepted intent into canonical structured objects. |
| FR-005 | Conflict detection | Detect contradictory requirements, overlapping rules, incompatible states, and duplicate semantics. |
| FR-006 | Completeness analysis | Identify missing actors, permissions, error cases, states, acceptance criteria, data constraints and edge cases. |
| FR-007 | Specification review | Review an existing specification and propose improvements without silently changing approved intent. |
| FR-008 | Spec quality scoring | Provide dimension-specific quality indicators, not a single opaque score. |
| FR-009 | Versioning | Track every approved specification change with author, source, timestamp and rationale. |
| FR-010 | Traceability | Link requirements to rules, workflows, APIs, entities, tests, code and commits. |
| FR-011 | Reverse engineering | Analyze an existing repository and reconstruct candidate specifications. |
| FR-012 | Evidence capture | Store exact source locations and evidence for inferred facts. |
| FR-013 | Implementation review | Compare current implementation against approved specification. |
| FR-014 | Drift detection | Detect implemented behavior absent from spec and specified behavior absent/contradictory in code. |
| FR-015 | Impact analysis | Determine affected requirements/code/tests/APIs when a specification or code element changes. |
| FR-016 | Context compilation | Generate minimal relevant agent context for a task. |
| FR-017 | Agent interoperability | Expose project knowledge through MCP, CLI and API. |
| FR-018 | Spec Kit integration | Import/export/adapt canonical specification into Spec Kit artifacts and workflows. |
| FR-019 | Editor portability | Support repository-local instructions and MCP so agents can switch without losing project knowledge. |
| FR-020 | Human approval gates | Require review for material inferred/semantic changes. |
| FR-021 | Audit | Maintain immutable audit history for approvals, changes, imports and synchronization. |
| FR-022 | CI verification | Allow specification/implementation checks in CI. |
| FR-023 | Offline/local mode | Core repository-local workflow must work without mandatory cloud access. |
| FR-024 | Cloud collaboration | Optional centralized synchronization for teams. |
| Finding | Meaning | Action |
| --- | --- | --- |
| Implemented | Specification has evidence in current code/tests. | Mark covered; keep evidence. |
| Partially implemented | Only some conditions/paths are implemented. | Create remediation task. |
| Missing implementation | No credible implementation evidence. | Create task or reject requirement. |
| Contradiction | Code behavior conflicts with approved intent. | Human review required. |
| Undocumented behavior | Code implements meaningful behavior not in spec. | Review as candidate requirement. |
| Stale spec | Spec references removed/changed implementation. | Review and update. |
| Unverifiable | Insufficient evidence. | Request better analyzer/test evidence. |
| Integration | Role | v1 stance |
| --- | --- | --- |
| MCP | Universal agent/tool interface | First-class |
| Git | Versioning/portability | First-class |
| GitHub/GitLab | PRs, issues, CI | Adapter |
| Spec Kit | SDD workflow/agent integrations | Adapter |
| Graphify or similar code graph | Codebase relationship knowledge | Adapter |
| OpenAPI/JSON Schema | API/data contracts | Import/export |
| OpenTelemetry | Observability/traces | Optional integration |
| Issue trackers | Requirement/change provenance | Adapter |
| Local LLM/Ollama | Offline/local inference | Provider adapter |
| Cloud LLMs | Inference | Provider adapters |
| Area | Target |
| --- | --- |
| Correctness | Deterministic validators must be unit-tested; no silent semantic mutation. |
| Reliability | Idempotent sync and resumable long-running analyses. |
| Performance | Interactive structured queries target <500 ms p95 locally excluding LLM inference. |
| Scalability | Support monorepos through incremental indexing and task-scoped analysis. |
| Portability | Linux/macOS/Windows CLI; repository-local format; no vendor lock-in. |
| Observability | Structured logs, metrics, traces, correlation IDs. |
| Auditability | Complete mutation history and provenance. |
| Maintainability | Modular boundaries, contract tests, ADRs, automated quality gates. |
| Testability | Unit + integration + contract + end-to-end + fixture-based reverse-engineering tests. |
| Accessibility | Web UI target WCAG 2.2 AA. |
| Internationalization | UTF-8 and localization-ready data model. |
| Disaster recovery | Git remains recoverable baseline; cloud backups and export available. |
| Layer | Examples |
| --- | --- |
| Unit | Rule validators, parsers, graph algorithms, diff engine, state machine validator. |
| Contract | MCP schemas, OpenAPI, file schema, Spec Kit adapter contract. |
| Integration | Git, DB, code analyzers, LLM provider adapters, graph providers. |
| End-to-end | Natural language â†’ spec â†’ review â†’ implementation review. |
| Regression | Known ambiguity/contradiction/reverse-engineering fixtures. |
| Security | Prompt injection, path traversal, secret leakage, unsafe tool invocation. |
| Performance | Large repo indexing, incremental analysis, context retrieval. |
| Compatibility | Agent/editor adapter matrix and Spec Kit version matrix. |
| Phase | Deliverables |
| --- | --- |
| P0 Foundation | Canonical schema, Git-native .spec/, CLI init/status/validate, basic web viewer. |
| P1 Agent Bridge | MCP server, context compiler, project contract, provider-neutral agent integration. |
| P2 Specification Intelligence | Capture, clarification orchestration, review, ambiguity/contradiction/completeness analysis. |
| P3 Reverse Engineering | Repository inventory, AST adapters, API/DB/test analyzers, evidence model. |
| P4 Synchronization | Specâ†”code comparison, drift findings, impact analysis, remediation changesets. |
| P5 Ecosystem | Spec Kit adapter, Graphify/code-graph adapter, GitHub/GitLab/issue tracker adapters. |
| P6 Collaboration | Optional cloud service, team review, permissions, audit, organization knowledge. |
| P7 Governance | Policy packs, compliance controls, domain packs, enterprise catalogs. |
| Risk | Mitigation |
| --- | --- |
| LLM hallucination | Evidence, confidence, deterministic validators, human approval. |
| Agent lock-in | MCP/API/CLI + canonical Git format. |
| Token explosion | Context compiler, incremental indexing, structured retrieval. |
| Spec becoming stale | CI sync checks and drift detection. |
| Overengineering | Start modular monolith; adapters before custom infrastructure. |
| Code graph duplication | Integrate external graph providers first. |
| Unsafe agent actions | Least privilege, sandboxing, approvals, audit. |
| Schema churn | Versioned schema + migration tooling + compatibility tests. |
| False reverse-engineering certainty | Candidate status + confidence + evidence + review. |
| Cloud dependency | Git-native local baseline and export. |
