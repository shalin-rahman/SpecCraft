
# 1. Evolution of Requirements Engineering — From Documents to AI-Assisted Development

### What this image is about

This image establishes the **historical motivation** for the project.

The central idea is that software engineering has repeatedly introduced new ways of capturing, organizing, implementing, and validating software requirements.

The progression is approximately:

**Document-based requirements → structured requirements → models and traceability → Agile/BDD → DevOps/automation → LLM/AI-assisted development**

The important point is not that the earlier approaches were "bad" and the newer approaches are "better." Rather, each development changed **where engineering knowledge lived and how developers interacted with it**.

### Stage 1 — Document-centric requirements

Early software projects relied heavily on:

* meetings
* interviews
* specifications
* SRS documents
* change requests
* manually maintained documentation

The requirement might be something like:

> "The system shall allow members to close their membership."

The problem is that this sentence doesn't necessarily tell us:

* Who can perform the action?
* Under what conditions?
* What happens to outstanding transactions?
* What happens to the member's account?
* Can the membership be reopened?
* What must be recorded?

So requirements could be **ambiguous or incomplete**, even when there was a formal document.

### Stage 2 — Structured requirements

Requirements-management systems introduced more structure:

```text
REQ-001
Description: Member registration
Priority: High
Status: Approved
```

Now requirements could be:

* uniquely identified
* reviewed
* versioned
* prioritized
* traced through changes

This was an important improvement, but the fundamental semantic problem remained: **a structured requirement is not automatically an unambiguous requirement.**

### Stage 3 — Models and traceability

Then software engineering increasingly connected requirements to:

* use cases
* UML models
* architecture
* design
* test cases

For example:

```text
REQ-001
   ↓
Use Case UC-01
   ↓
Customer class
   ↓
API
   ↓
TEST-001
```

This introduced the important idea of **traceability**.

The analysis does not stop at the written requirement; it also considers the related design, implementation, and test artifacts.

But maintaining these relationships manually can itself become costly.

### Stage 4 — Agile and BDD

Agile changed the representation again.

Instead of relying entirely on large specification documents, requirements became:

* user stories
* acceptance criteria
* backlog items
* BDD scenarios

For example:

> As a member, I want to close my membership.

Then:

```text
Given balance = 0
When authorized officer closes membership
Then status = CLOSED
```

Now the requirement is much closer to something a developer and tester can work with.

However, project knowledge becomes distributed across:

* Jira/backlog
* discussions
* documents
* code
* tests
* decisions

### Stage 5 — DevOps

Git, CI/CD, automated tests, pull requests and code review made the development loop more continuous:

```text
Requirement
   ↓
Issue
   ↓
Code
   ↓
Pull Request
   ↓
CI
   ↓
Tests
   ↓
Deployment
```

Implementation and verification became increasingly automated.

But an important question remains:

> Does the automated development pipeline necessarily know the original business intent?

Not necessarily.

### Stage 6 — LLMs and AI coding agents

Now the developer can say:

> "Add membership closure functionality."

An AI coding agent may:

* inspect the repository
* identify relevant classes
* modify code
* generate tests
* run commands
* explain the changes

This dramatically changes the **cost of implementation and repository interaction**.

But it introduces another question:

> What exactly should the AI regard as authoritative project knowledge?

The answer may currently be spread across:

```text
Prompt
Chat history
Documentation
Code
Tests
Developer assumptions
Git history
Previous agent sessions
```

### Why this problem matters

The motivation for the project is straightforward:

> **As software implementation becomes increasingly AI-assisted, preserving the project's engineering knowledge becomes an increasingly important concern.**

The project is not limited to the claim that AI can generate code. That capability is already established.

The central question is:

> **How can software intent, requirements, rules, decisions, implementation relationships and evidence remain structured and reusable while development is performed by humans and different AI agents?**

### Key takeaway

This image establishes that software development has become increasingly automated, but the knowledge describing what the software is supposed to mean remains distributed across many artifacts and interactions.

---

# 2. Current Technology Landscape — What Already Exists?

### What this image is about

This image addresses a common question:

> **"Don't tools already do this?"**

The answer is yes: many components already exist. That is important, because the research is not trying to invent these capabilities from scratch. It investigates how they can participate in a **persistent engineering-knowledge layer**.

Examples include:

* requirements management
* AI coding
* specification-driven development
* traceability
* code analysis
* code graphs
* MCP
* automated testing

---

## Requirements management systems

Examples include:

* IBM DOORS
* Jama Connect

Their role is primarily around structured requirements management.

They can represent things such as:

```text
REQ-104
Member Closure
Status: Approved
```

and relationships such as:

```text
Requirement
    ↓
Design
    ↓
Test
```

These systems demonstrate that **persistent structured requirements and traceability are established engineering concepts**.

They are therefore part of the technological foundation of the research rather than competitive systems that must be replaced.

---

## AI coding agents

Examples include:

* GitHub Copilot
* OpenAI Codex
* Claude Code
* Cursor
* Gemini-based development tools

These tools address a different part of the lifecycle.

The basic pattern is:

```text
Human
  ↓
Natural language
  ↓
AI agent
  ↓
Repository context
  ↓
Code
  ↓
Tests
```

This demonstrates the emergence of **agentic software development**.

The agent typically operates as a development participant, however, and the central question is different:

> What persistent project-level knowledge should the agent consume?

---

## Specification-driven development

The landscape also includes systems and workflows such as:

### GitHub Spec Kit

A specification-oriented workflow such as:

```text
Specify
   ↓
Clarify
   ↓
Plan
   ↓
Tasks
   ↓
Implement
   ↓
Converge
```

### Kiro

A representative flow:

```text
Natural language
      ↓
requirements.md
      ↓
design.md
      ↓
tasks.md
      ↓
implementation
```

### Tessl

A specification can connect requirements with target implementation and tests.

These are important because they demonstrate that **specifications are becoming active development artifacts rather than merely documentation produced before coding.**

---

## Code knowledge

Then there is another category:

**Code understanding / code knowledge graphs.**

For example, a code graph can represent:

```text
MemberService.Close()
        ↓
MemberRepository.Update()
        ↓
Member.Status
        ↓
Database
```

This allows an agent or developer to ask questions such as:

* Who calls this method?
* What does this method call?
* What is affected if this function changes?
* How does this behavior propagate?

MCP provides another important concept:

```text
AI Agent
    ↕
   MCP
    ↕
Tools / Files / Services / Knowledge
```

---

## So what is missing?

This is where careful framing is required.

Don't say:

> "None of these tools can do this."

Instead say:

> **These technologies address different parts of the engineering lifecycle. The research opportunity is to investigate how project knowledge can be represented and connected across these layers.**

For example:

```text
Requirements
      ↕
Business Rules
      ↕
Workflows
      ↕
Architecture
      ↕
Code
      ↕
Tests
      ↕
Evidence
```

The proposed research is therefore **compositional**, not necessarily a replacement for these technologies.

### Key takeaway

> **The project is not trying to reinvent requirements tools, coding agents or SDD. It investigates the persistent knowledge layer that can connect their outputs and make project meaning reusable across development contexts.**

---

# 3. Proposed Architecture — Persistent Specification & Engineering Knowledge

This is the **central image of the project**.

Images 1 and 2 establish the problem.

Image 3 presents the proposed response.

---

## The core idea

Separate:

### AI intelligence

from:

### Project knowledge

The AI agent can change.

The project knowledge should remain.

For example:

```text
                 PROJECT
                    │
          Canonical Knowledge
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      Codex       Claude      Copilot
        ↓           ↓           ↓
      Code        Code        Code
```

The agents are consumers and contributors to project knowledge—not the permanent storage mechanism for that knowledge.

---

## What is inside the knowledge layer?

The canonical representation could contain:

### Requirements

```text
REQ-104
Member closure requirement
```

### Business rules

```text
BR-021
Outstanding balance must equal zero.
```

### Workflow

```text
ACTIVE
  ↓
CLOSURE REQUEST
  ↓
APPROVAL
  ↓
CLOSED
```

### API

```text
POST /members/{id}/close
```

### Security

```text
MembershipOfficer
```

### Tests

```text
MemberClosure_WhenBalanceZero
```

### Decisions

Architectural decisions and approved assumptions.

### Evidence

Where the information came from.

---

## Why provenance matters

Suppose the system discovers:

> "A member cannot close their account while balance is outstanding."

Where did that statement come from?

Possibilities:

```text
Human requirement
Documentation
Code
Test
AI inference
Existing system behavior
```

Those are not equivalent.

Therefore the system can represent:

```text
Source: Code
Status: Code-inferred
Confidence: Medium
Human approval: Pending
```

This is especially important for brownfield systems.

---

## Context compiler

One of the most useful architectural concepts is the **context compiler**.

Imagine the project has:

* 800 requirements
* 400 business rules
* 200 APIs
* 100 architecture decisions
* thousands of source files
* thousands of tests

The system should avoid placing the entire project context into every AI prompt.

Instead:

```text
Developer:
"Implement membership closure."

             ↓

Context Compiler

             ↓

Relevant context:

REQ-104
BR-021
Member entity
Closure workflow
API contract
RBAC rule
Relevant source files
Relevant tests
```

The agent receives **task-relevant context**, not the entire project.

This makes the architecture useful even when different agents have different context mechanisms.

---

## Greenfield

For a new system:

```text
Human idea
 ↓
Requirements
 ↓
Specification
 ↓
Implementation
 ↓
Tests
```

The knowledge layer is created progressively.

---

## Brownfield

For an existing system:

```text
Repository
 ↓
Code analysis
 ↓
Tests
 ↓
Documentation
 ↓
Git history
 ↓
Candidate specification
 ↓
Human validation
```

The important academic limitation is:

> Code tells us about observed implementation behavior. It does not automatically tell us the original business intent.

Therefore reconstructed specifications should carry evidence and require appropriate human validation.

---

## Continuous synchronization

Once the specification exists, it should not become another static document.

Instead:

```text
Specification
     ↕
    Code
     ↕
    Tests
     ↕
  Evidence
```

A change can trigger questions such as:

> Which requirements are affected by this code change?

or:

> Which tests may need updating because this requirement changed?

This is where **traceability + impact analysis + drift detection** become useful.

### Key takeaway

> **The proposed system is not another coding agent. It is a persistent, structured representation of project engineering knowledge that AI agents and development tools can consume and update.**

---

# 4. Requirements Engineering Evaluation Journey

### What this image is about

This image follows the background context established in the earlier section.

It shifts from historical context to a more concrete question:

> **What engineering problems should the system be evaluated against?**

This gives the research a more rigorous foundation.

---

## Evaluation problem 1 — Ambiguity

Consider:

> "The system should process membership quickly."

What does "quickly" mean?

Possibilities could be:

```text
< 1 second
< 5 seconds
same business day
```

The system can identify this as something requiring clarification.

The important claim is not:

> "AI eliminates ambiguity."

Instead:

> **The system can assist in identifying potentially ambiguous requirements and generate clarification questions.**

Human stakeholders still determine the intended meaning.

---

## Problem 2 — Incompleteness

Consider:

> "Member can close membership."

Questions immediately appear:

* Who can close it?
* When?
* Is approval required?
* What happens to outstanding balance?
* What happens to pending transactions?
* What happens to associated accounts?
* Is reopening possible?
* What audit information is required?

The evaluation can therefore examine whether the system helps identify **missing requirement dimensions**.

---

## Problem 3 — Contradiction

Example:

```text
REQ-104:
Closed members cannot transact.

REQ-121:
Closed members may create new transactions.
```

The system can flag:

> Potential contradiction.

Again, it should not independently decide which requirement is correct.

A stakeholder or authorized reviewer resolves it.

---

## Problem 4 — Requirement → implementation

Suppose a requirement includes:

```text
REQ-104
Member closure requires zero balance.
```

And somewhere in the repository:

```text
MembershipService.Close()
```

Can the system establish a relationship?

```text
REQ-104
   ↕
MembershipService.Close()
```

That is a **traceability question**.

---

## Problem 5 — Requirement → test

Suppose the implementation exists.

But where is the test?

```text
REQ-104
   ↓
Code ✓
   ↓
Test ?
```

The system can identify a potentially unverified requirement.

Again, this is a finding—not a claim that the requirement is necessarily incorrect.

---

## Problem 6 — Change impact

Suppose the rule changes from:

```text
Balance = 0
```

to:

```text
Balance = 0
+
Officer approval
```

Potentially affected artifacts include:

```text
Workflow
API
Authorization
Service
UI
Tests
Documentation
```

This creates a clear evaluation question:

**Can the system identify relevant downstream artifacts?**

---

## Problem 7 — Existing software

This is especially interesting academically.

Suppose there is a 10-year-old application with:

* source code
* database
* tests
* Git history
* documentation

but no reliable current specification.

The proposed process can produce:

```text
Existing evidence
       ↓
Analysis
       ↓
Candidate specification
       ↓
Human validation
```

The evaluation can measure how closely the reconstructed specification agrees with an expert-produced baseline.

### Key takeaway

> **The project can be evaluated using concrete engineering problems—ambiguity, incompleteness, contradiction, traceability, impact analysis, drift and brownfield reconstruction—rather than simply asking whether an AI "looks useful."**

---

# 5. Why Specification-Driven Development?

### What this image is about

This image addresses the question:

> **Why introduce specification as an explicit development artifact?**

A common objection is that better prompts or stronger model instructions might be enough on their own.

---

## Approach 1 — Prompt/code oriented

A developer might say:

> "Add member closure."

The agent interprets the request based on:

* current conversation
* repository
* system instructions
* available documentation
* model reasoning

Then it produces code.

The problem isn't that this can't work.

The question is:

> **Where is the durable representation of what "member closure" actually means?**

---

## Approach 2 — Specification-driven

Instead:

```text
Intent
 ↓
Requirements
 ↓
Specification
 ↓
Plan
 ↓
Tasks
 ↓
Implementation
 ↓
Verification
```

Now there is an explicit artifact between **human intent and implementation**.

That's the fundamental conceptual value of SDD.

---

## Existing SDD approaches

Tools such as:

* GitHub Spec Kit
* Kiro
* Tessl

demonstrate different implementations of specification-centered workflows.

These tools are not interchangeable. They represent related but distinct approaches within the broader movement toward making specifications active development artifacts.

---

## Research extension

The research question is:

> **Can the specification become a persistent project-level knowledge representation that remains useful beyond one particular SDD workflow?**

For example:

```text
Canonical project knowledge
        ↓
Spec Kit
Kiro
Tessl
Codex
Claude
Copilot
Cursor
CLI
IDE
Web UI
```

The distinction is important.

The research does not argue that a specification system replaces SDD. It examines whether a **shared knowledge layer can sit underneath different SDD and agent workflows.**

### Key takeaway

> **SDD makes software intent explicit. This research investigates how that intent can become persistent, structured, traceable and reusable across development environments.**

---

# 6. One Knowledge Layer — Greenfield, Brownfield and Continuous Development

### What this image is about

This image demonstrates that the project is not limited to greenfield development.

It can address three different software situations.

---

## Greenfield

A completely new project.

Example:

> "Build a membership management system."

The process:

```text
Business idea
 ↓
Requirements
 ↓
Clarification
 ↓
Specification
 ↓
Design
 ↓
Implementation
 ↓
Tests
```

The knowledge layer starts relatively empty and grows.

---

## Brownfield

An existing system.

Imagine:

```text
10-year-old application
```

with:

* source code
* database
* APIs
* tests
* Git history
* incomplete documentation

These sources can be analyzed to construct **candidate specifications**.

For example:

```text
Code:

MembershipService.Close()

Database:

Member.Status

Test:

MemberClosureTest
```

Together they provide evidence of current behavior.

But the system shouldn't simply say:

> "This is the business requirement."

Instead:

> "This behavior is observed in the implementation."

Then a human can validate the business meaning.

This distinction significantly strengthens the academic design.

---

## Continuous development

Once the system is running, requirements change.

Suppose:

> "Officer approval is now required."

The system can identify potentially affected:

```text
Business rule
 ↓
Workflow
 ↓
API
 ↓
Authorization
 ↓
Service
 ↓
Tests
 ↓
Documentation
```

That is where the system moves from being a **specification generator** to a **living engineering knowledge system**.

---

## One layer across all three

The same knowledge model can support:

```text
GREENFIELD
Create knowledge

BROWNFIELD
Reconstruct knowledge

CONTINUOUS
Maintain knowledge
```

This is a particularly strong conceptual point for the research.

### Key takeaway

> **The same knowledge representation can support creation, reconstruction and continuous maintenance of software engineering knowledge.**

---

# 7. Worked Example — One Requirement Through the Entire System

### What this image is about

This is often the clearest image for a non-specialist audience.

Instead of explaining the architecture abstractly, the presentation follows **one requirement**.

---

## Step 1 — Human requirement

Start with:

> "A member may close membership only when the outstanding balance is zero and an authorized officer approves the closure."

This is intentionally natural language.

---

## Step 2 — Structured requirement

The system extracts:

```text
REQ-104

Actor:
Membership Officer

Entity:
Member

Precondition:
Outstanding balance = 0

Authorization:
Membership Officer
```

The original human statement remains available.

---

## Step 3 — Business rule

The system represents:

```text
BR-021

outstanding_balance = 0
```

and:

```text
authorized_officer = true
```

Now the business logic is explicit.

---

## Step 4 — Workflow

The requirement becomes a state transition:

```text
ACTIVE
   ↓
CLOSURE REQUEST
   ↓
OFFICER APPROVAL
   ↓
CLOSED
```

Possible rejection paths:

```text
Balance > 0
      ↓
   REJECT

Unauthorized
      ↓
   REJECT
```

This makes the behavior more precise than the original sentence alone.

---

## Step 5 — API

The requirement can then be associated with:

```text
POST /members/{id}/close
```

The specification knows that this API represents the relevant operation.

---

## Step 6 — Code

The implementation might contain:

```text
MembershipService.Close()
```

with logic for:

```text
check balance
check authorization
update status
record audit event
```

The relationship can then be represented as:

```text
Requirement
     ↕
API
     ↕
Service
```

---

## Step 7 — Test

The behavior becomes testable:

```text
Given:
balance = 0
authorized officer = true

When:
close membership

Then:
status = CLOSED
audit event recorded
```

Now:

```text
Requirement
    ↕
Rule
    ↕
Workflow
    ↕
API
    ↕
Code
    ↕
Test
```

This is the essence of traceability.

---

## Step 8 — Evidence

Each relationship can have evidence.

For example:

```text
REQ-104
Source: Human

BR-021
Source: Approved requirement

Implementation
Source: MembershipService.Close()

Verification
Source: MemberClosureTest
```

For brownfield reconstruction:

```text
Source: Code
Status: Code-inferred
Human approval: Pending
```

That distinction prevents AI-generated interpretations from silently becoming authoritative facts.

---

## Step 9 — Change

Now imagine the business changes:

> "Officer approval is now mandatory."

The system can ask:

```text
What is affected?
```

Potential results:

```text
Workflow
API authorization
Service logic
Tests
Documentation
```

This demonstrates why the knowledge layer is more than a document repository.

### Key takeaway

> **A single natural-language requirement can become a connected engineering object linking intent, rules, workflow, implementation, tests and evidence.**

This is often the clearest image to use when asked:

> "Okay, but what does the system actually do?"

---

# How the seven images form one coherent research presentation

A suitable ordering is:

```text
                    RESEARCH STORY

        ┌─────────────────────────────┐
        │ 1. EVOLUTION                │
        │ Why did this problem emerge?│
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 2. CURRENT LANDSCAPE        │
        │ What already exists?        │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 5. WHY SDD?                 │
        │ Why make specification      │
        │ an explicit artifact?       │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 4. EVALUATION PROBLEMS      │
        │ What questions should be     │
        │ evaluated?                  │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 3. PROPOSED ARCHITECTURE    │
        │ What is being proposed?     │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 6. THREE MODES              │
        │ Where can it be used?       │
        └─────────────┬───────────────┘
                      ↓
        ┌─────────────────────────────┐
        │ 7. WORKED EXAMPLE           │
        │ How does it actually work?  │
        └─────────────────────────────┘
```

There is also a useful distinction between the seven:

| Image                 | Main question it answers                                 |
| --------------------- | -------------------------------------------------------- |
| **1. Evolution**      | Why did this research problem emerge?                    |
| **2. Landscape**      | What technologies already exist?                         |
| **3. Architecture**   | What is the proposed system?                             |
| **4. Evaluation**     | What concrete engineering problems will be evaluated?    |
| **5. SDD**            | Why is specification an important development artifact?  |
| **6. Three Modes**    | How does the approach work for new and existing systems? |
| **7. Worked Example** | What happens to one real requirement?                    |

### The strongest academic framing

The overall research argument is:

> **Software engineering has progressively moved from informal communication toward structured requirements, traceability, executable tests, automation and now AI-assisted development.**

↓

> **AI agents make implementation increasingly accessible, but project knowledge can still be distributed across requirements, conversations, code, tests, decisions and agent sessions.**

↓

> **Existing technologies already provide important pieces: requirements management, SDD workflows, AI coding agents, code graphs and interoperability protocols.**

↓

> **The research opportunity is to investigate a persistent, structured, evidence-backed and agent-independent representation of project engineering knowledge.**

↓

> **The system can then be evaluated through concrete engineering activities such as clarification, consistency checking, traceability, impact analysis, specification reconstruction and specification/code synchronization.**

↓

> **The approach can support greenfield projects, brownfield reconstruction and continuous development.**

