<!-- converted from SpecCraft_Conversation_Article.docx -->

From Spec Kit to an Agent-Independent Specification Layer
Version 1.0 â€¢ 25 September 2026
Reference architecture and implementation specification

# Article Abstract
The conversation that led to SpecCraft started with a simple question: what is Specification-Driven Development, and can natural-language requirements be converted into specifications that AI coding agents can actually use? The discussion quickly moved beyond the idea of a better prompt and toward a more fundamental problem: how can the same software project retain a consistent, authoritative understanding when developers switch between AI agents, models, editors and sessions?
# 1. The starting point: Specification-Driven Development
Specification-Driven Development treats the specification as an active engineering artifact rather than documentation written after implementation. The intended behavior is clarified first, then planned, implemented, tested and checked for convergence.
Human intent
   â†“
Specification
   â†“
Plan
   â†“
Tasks
   â†“
Implementation
   â†“
Verification / convergence
# 2. The discovery: Spec Kit already does much of this
GitHub Spec Kit provides a structured SDD workflow for coding agents. Its current documentation describes Specify â†’ Plan â†’ Tasks â†’ Implement â†’ Converge and supports a broad range of agent integrations. It also supports workflows, extensions, presets and existing-project adoption.
This changed the product question. Building another agent workflow that simply tells an LLM to write requirements would duplicate capabilities that agents and SDD frameworks already provide.
# 3. The second discovery: most specification behavior can be an agent skill
Requirements extraction, clarification, rule discovery, workflow drafting, acceptance criteria generation and even specification review can be described as agent instructions, templates and examples. Therefore, an 'AI Specification Agent' by itself is not a strong product boundary.
# The real gap
The stronger problem is persistence. A developer may use Codex today, Cursor tomorrow, Claude Code later, and Copilot afterward. Those agents have different sessions, models, instructions and context windows. The project still needs one stable understanding of what has been decided.
# 4. The proposed answer: a shared specification layer
SpecCraft emerged as a specification and engineering knowledge layer rather than another coding agent. The agent remains responsible for reasoning and implementation. SpecCraft stores and validates the durable project knowledge that agents need.
Agent / IDE / Chat
        â†•
      MCP/API
        â†•
Canonical project specification
        â†•
Git + evidence + code relationships
# 5. Why the canonical model matters
Markdown is useful for humans, but a durable engineering system also needs structured relationships. A requirement should be linkable to a business rule, workflow, API, entity, test, code location and decision. That creates a traceability graph instead of a collection of disconnected documents.
# 6. The agent is not the database
Conversation history is ephemeral. It should never be the authoritative project state. An approved requirement should survive a model change, editor change, branch switch, laptop change or new AI session.
Codex establishes:
  REQ-001 = membership closure requires zero balance

Later:
  Cursor asks the specification layer

Later:
  Claude asks the same question

All receive the same approved requirement.
The agents can change. The project's meaning does not.
# 7. Why Graphify-like code graphs matter
A specification graph describes intended behavior; a code graph describes implementation relationships. They are complementary. A code graph can show that a controller calls a service, which updates a repository and a database field. It does not automatically establish why the business requires that behavior.
CODE GRAPH
Function â†’ Function â†’ Repository â†’ Database

SPEC GRAPH
Requirement â†’ Rule â†’ Workflow â†’ API â†’ Test

TRACEABILITY
Requirement â†” Code â†” Test
Therefore, the proposed platform should initially integrate with existing code-graph technology rather than build a competing graph engine.
# 8. Reverse engineering changes the value proposition
Spec Kit's current existing-project guidance intentionally does not claim to reconstruct a complete specification from an existing application. It initializes the workflow and asks teams to capture the rules that matter for future changes. That leaves a useful complementary capability: reverse engineering.
A reverse-engineering mode can analyze source code, APIs, database schemas, tests, configuration, dependency graphs and Git history. It then proposes candidate requirements with confidence and exact evidence. Those candidates require human review before becoming authoritative.
# 9. Specification review is not the same as rewriting
An existing specification should be treated as a reviewed artifact. The system should identify vague requirements, missing acceptance criteria, contradictions, duplicate semantics, stale references, incomplete workflows and missing authorization rules. It should propose changes as findings rather than silently rewriting approved intent.
# 10. Synchronizing the current implementation
Once both specification and implementation are represented, the platform can perform a two-way review. It can find specified behavior that is not implemented, code behavior that is not specified, and implementation behavior that contradicts approved requirements.
Specification
     â†“
Compare
     â†‘
Current implementation

Results:
âœ“ implemented
âš  partial
âœ— missing
âš  contradiction
âš  undocumented
âš  stale specification
# 11. The token-cost problem
Sending the entire project specification and repository to every agent session would be expensive and often worse for reasoning. The proposed Context Compiler solves this by retrieving only the requirements, rules, workflow paths, code evidence and tests relevant to the current task.
Task: "Implement member closure"

Context compiler
  â†’ relevant requirement
  â†’ related rules
  â†’ workflow
  â†’ API contract
  â†’ entity
  â†’ tests
  â†’ relevant code

Only that context goes to the agent.
This also makes the system model/provider neutral: the same canonical project knowledge can be projected into different context formats for different agents.
# 12. Why MCP becomes important
Instead of implementing a custom integration for every editor and agent, the specification layer can expose a stable MCP interface. Agents can search requirements, retrieve workflows, ask for impact analysis, build task context, submit proposed changes and request verification.
spec.search()
spec.requirement.get()
spec.impact.analyze()
spec.context.build()
spec.change.create()
spec.verify.run()
# 13. Git remains the portability baseline
The project should not become dependent on a cloud account just to understand itself. Canonical specification artifacts should live in a repository-local .spec/ directory and be versioned with Git. Cloud services can provide collaboration, centralized indexing, audit and organization-level knowledge, but the project should remain portable.
# 14. Spec Kit becomes an adapter, not the foundation
Spec Kit is valuable and should be used rather than reimplemented. The proposed architecture treats it as one SDD execution adapter. Canonical SpecCraft objects can be projected into Spec Kit's artifacts, and Spec Kit artifacts can be imported with provenance.
SpecCraft canonical model
        â†“
Spec Kit adapter
        â†“
Specify / Plan / Tasks / Implement / Converge
        â†“
Coding agent
# 15. The resulting architecture
HUMAN
                       â†“
               Agent / IDE / Chat
                       â†“
                   MCP/API
                       â†“
        +-----------------------------+
        |        SPEC PLATFORM        |
        | Requirements                |
        | Rules / Workflows           |
        | Entities / APIs / Tests     |
        | Decisions / Architecture    |
        | Evidence / Traceability     |
        | Validation / Impact         |
        | Drift / Synchronization     |
        | Context Compiler            |
        +-----------------------------+
             â†“       â†“       â†“
            Git   Code Graph  Spec Kit
             â†“       â†“       â†“
                  CODE
# 16. What should not be built
- Another general-purpose coding agent.
- A proprietary replacement for every editor integration.
- A prompt library marketed as a platform.
- A fork of Spec Kit that permanently diverges from upstream.
- A second code graph when an external graph provider is sufficient.
- A system that silently converts AI guesses into business truth.
# 17. What should be built
- Canonical, versioned specification model.
- Evidence-backed requirements and inference.
- Specification review and improvement engine.
- Reverse engineering pipeline.
- Specâ†”code synchronization and drift detection.
- Traceability and impact analysis.
- Context compiler.
- MCP server and CLI.
- Git-native project format.
- Adapters for Spec Kit, code graphs, issue trackers and agent-specific context files.
# 18. The core thesis
The most durable abstraction is not the AI model, coding editor, or SDD workflow. It is the project's structured understanding of itself. Models will change. Agents will change. Editors will change. Spec Kit will evolve. Code graphs will evolve. If the project's requirements, decisions, evidence, relationships and verification state are represented independently, those tools can change without the project losing its memory.
# 19. Current ecosystem perspective
The current ecosystem supports this conclusion. Spec Kit provides an extensible SDD process and multiple agent integrations; its workflow engine supports resumable multi-step processes and human gates. Code-graph tools address repository structure and relationships. MCP provides a standard way for agents to access external tools and data. The opportunity is therefore not to replace these components but to connect them around a canonical, portable specification layer.
# 20. Closing
The resulting product is best understood as a 'specification infrastructure for agents.' It gives AI coding systems a stable project memory, gives humans a reviewable record of intent, and gives engineering teams a mechanism to compare what the software is supposed to do with what the software actually does.
# References
- GitHub Spec Kit: https://github.com/github/spec-kit
- Spec Kit documentation: https://github.github.com/spec-kit/
- Spec Kit existing projects: https://github.com/github/spec-kit/blob/main/docs/guides/existing-projects.md
- Spec Kit workflows: https://github.com/github/spec-kit/blob/main/docs/reference/workflows.md
- Spec Kit integrations: https://github.com/github/spec-kit/blob/main/docs/reference/integrations.md
This article is an article-style synthesis of the design discussion in this conversation, organized into a coherent narrative rather than a verbatim transcript.
