# buildCodeGraph()

> God node · 7 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\code-graph.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/code-graph.js#L29)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as buildCodeGraph()
    participant P1 as .parse()
    participant P2 as .withLock()
    participant P3 as .enqueue()
    participant P4 as .reapStaleLock()
    participant P5 as .claimNext()
    participant P6 as .complete()
    participant P7 as .fail()
    participant P8 as .propose()
    participant P9 as .createProject()
    participant P10 as .saveRevision()
    participant P11 as .proposeChange()
    participant P12 as .appendAudit()
    participant P13 as decodeJsonWebToken()
    participant P14 as .read()
    participant P15 as commonResult()
    participant P16 as createPlatformServer()
    participant P17 as .loadJwks()
    participant P18 as body()
    participant P19 as extractSymbols()
    participant P20 as .read()
    participant P21 as .set()
    participant P22 as analyzeRepository()
    participant P23 as moduleNodeId()
    participant P24 as resolveScannedImport()
    participant P25 as isTestFile()
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
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P2->>+ P9: calls
    P9-->>- P2: return
    P2->>+ P10: calls
    P10-->>- P2: return
    P2->>+ P11: calls
    P11-->>- P2: return
    P2->>+ P12: calls
    P12-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
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
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P1->>+ P20: calls
    P20-->>- P1: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
    P0->>+ P24: calls
    P24-->>- P0: return
    P0->>+ P25: calls
    P25-->>- P0: return
```

## Connections by Relation

### calls
- [[.parse()]] `INFERRED`
- [[.set()]] `INFERRED`
- [[analyzeRepository()]] `INFERRED`
- [[moduleNodeId()]] `EXTRACTED`
- [[resolveScannedImport()]] `EXTRACTED`
- [[isTestFile()]] `EXTRACTED`

### contains
- [[code-graph.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*