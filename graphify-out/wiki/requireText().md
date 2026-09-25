# requireText()

> God node · 4 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\spec-model.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/spec-model.js#L5)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as requireText()
    participant P1 as createRequirement()
    participant P2 as createTraceLink()
    participant P3 as createSpecProject()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P2->>+ P0: calls
    P0-->>- P2: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P3->>+ P0: calls
    P0-->>- P3: return
```

## Connections by Relation

### calls
- [[createRequirement()]] `EXTRACTED`
- [[createTraceLink()]] `EXTRACTED`
- [[createSpecProject()]] `EXTRACTED`

### contains
- [[spec-model.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*