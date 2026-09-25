# parsePathRoot()

> God node · 2 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\repository-platform.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/repository-platform.js#L19)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as parsePathRoot()
    participant P1 as ensureRepositoryRoot()
    participant P2 as scanRepository()
    participant P3 as walk()
    participant P4 as hash()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
```

## Connections by Relation

### calls
- [[ensureRepositoryRoot()]] `EXTRACTED`

### contains
- [[repository-platform.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*