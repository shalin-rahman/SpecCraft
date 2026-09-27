# decodeJsonWebToken()

> God node · 5 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\production-infrastructure.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/production-infrastructure.js#L37)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as decodeJsonWebToken()
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
    participant P13 as buildCodeGraph()
    participant P14 as .set()
    participant P15 as analyzeRepository()
    participant P16 as moduleNodeId()
    participant P17 as resolveScannedImport()
    participant P18 as isTestFile()
    participant P19 as .read()
    participant P20 as commonResult()
    participant P21 as createPlatformServer()
    participant P22 as .loadJwks()
    participant P23 as body()
    participant P24 as extractSymbols()
    participant P25 as .read()
    participant P26 as .verifyToken()
    participant P27 as .verifyToken()
    participant P28 as base64UrlDecode()
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
    P1->>+ P13: calls
    P13-->>- P1: return
    P13->>+ P1: calls
    P1-->>- P13: return
    P13->>+ P14: calls
    P14-->>- P13: return
    P13->>+ P15: calls
    P15-->>- P13: return
    P13->>+ P16: calls
    P16-->>- P13: return
    P13->>+ P17: calls
    P17-->>- P13: return
    P13->>+ P18: calls
    P18-->>- P13: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P1->>+ P20: calls
    P20-->>- P1: return
    P1->>+ P21: calls
    P21-->>- P1: return
    P1->>+ P22: calls
    P22-->>- P1: return
    P1->>+ P23: calls
    P23-->>- P1: return
    P1->>+ P4: calls
    P4-->>- P1: return
    P1->>+ P24: calls
    P24-->>- P1: return
    P1->>+ P25: calls
    P25-->>- P1: return
    P0->>+ P26: calls
    P26-->>- P0: return
    P0->>+ P27: calls
    P27-->>- P0: return
    P0->>+ P28: calls
    P28-->>- P0: return
```

## Connections by Relation

### calls
- [[.parse()]] `INFERRED`
- [[.verifyToken()]] `EXTRACTED`
- [[.verifyToken()]] `EXTRACTED`
- [[base64UrlDecode()]] `EXTRACTED`

### contains
- [[production-infrastructure.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*