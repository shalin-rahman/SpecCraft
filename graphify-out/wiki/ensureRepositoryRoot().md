# ensureRepositoryRoot()

> God node · 3 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\repository-platform.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/repository-platform.js#L11)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as ensureRepositoryRoot()
    participant P1 as scanRepository()
    participant P2 as walk()
    participant P3 as hash()
    participant P4 as languageFor()
    participant P5 as parsePathRoot()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P3: calls
    P3-->>- P1: return
    P3->>+ P2: calls
    P2-->>- P3: return
    P3->>+ P1: calls
    P1-->>- P3: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P5->>+ P0: calls
    P0-->>- P5: return
```

## Connections by Relation

### calls
- [[scanRepository()]] `EXTRACTED`
- [[parsePathRoot()]] `EXTRACTED`

### contains
- [[repository-platform.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*