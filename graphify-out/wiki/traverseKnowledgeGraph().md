# traverseKnowledgeGraph()

> God node · 6 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\knowledge-graph.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/knowledge-graph.js#L194)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as traverseKnowledgeGraph()
    participant P1 as .set()
    participant P2 as buildCodeGraph()
    participant P3 as .parse()
    participant P4 as analyzeRepository()
    participant P5 as moduleNodeId()
    participant P6 as resolveScannedImport()
    participant P7 as isTestFile()
    participant P8 as .createProject()
    participant P9 as .normalizeProject()
    participant P10 as createKnowledgeGraph()
    participant P11 as buildProjectTraceGraph()
    participant P12 as .register()
    participant P13 as .resolve()
    participant P14 as .withTransaction()
    participant P15 as .rotate()
    participant P16 as .allow()
    participant P17 as .allow()
    participant P18 as compileContext()
    participant P19 as calculateImpact()
    participant P20 as confidenceRank()
    participant P21 as asConfidence()
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
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P8: calls
    P8-->>- P1: return
    P8->>+ P1: calls
    P1-->>- P8: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P1->>+ P10: calls
    P10-->>- P1: return
    P10->>+ P1: calls
    P1-->>- P10: return
    P10->>+ P11: calls
    P11-->>- P10: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P0->>+ P18: calls
    P18-->>- P0: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
```

## Connections by Relation

### calls
- [[.set()]] `INFERRED`
- [[compileContext()]] `INFERRED`
- [[calculateImpact()]] `INFERRED`
- [[confidenceRank()]] `EXTRACTED`
- [[asConfidence()]] `EXTRACTED`

### contains
- [[knowledge-graph.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*