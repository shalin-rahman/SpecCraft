# digest()

> God node · 6 connections · [C:\Users\HabiburRahmanShalin\workstation\shaleen\ApplicationDevelopment\spec-craft\src\production-infrastructure.js](file:///C:/Users/HabiburRahmanShalin/workstation/shaleen/ApplicationDevelopment/spec-craft/src/production-infrastructure.js#L26)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as digest()
    participant P1 as .append()
    participant P2 as .list()
    participant P3 as .drain()
    participant P4 as .verify()
    participant P5 as ISO()
    participant P6 as .normalizeProject()
    participant P7 as .saveRevision()
    participant P8 as hash()
    participant P9 as scanRepository()
    participant P10 as ensureRepositoryRoot()
    participant P11 as walk()
    participant P12 as analyzeRepository()
    participant P13 as verifyHmacJwt()
    participant P14 as safeTokenMatches()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P5->>+ P7: calls
    P7-->>- P5: return
    P0->>+ P8: calls
    P8-->>- P0: return
    P8->>+ P0: calls
    P0-->>- P8: return
    P8->>+ P9: calls
    P9-->>- P8: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P9->>+ P11: calls
    P11-->>- P9: return
    P9->>+ P8: calls
    P8-->>- P9: return
    P9->>+ P12: calls
    P12-->>- P9: return
    P8->>+ P11: calls
    P11-->>- P8: return
    P0->>+ P13: calls
    P13-->>- P0: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P0->>+ P14: calls
    P14-->>- P0: return
```

## Connections by Relation

### calls
- [[.append()]] `EXTRACTED`
- [[hash()]] `INFERRED`
- [[verifyHmacJwt()]] `EXTRACTED`
- [[.verify()]] `EXTRACTED`
- [[safeTokenMatches()]] `INFERRED`

### contains
- [[production-infrastructure.js]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*