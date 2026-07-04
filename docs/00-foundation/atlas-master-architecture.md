# Atlas Master Architecture v0.1

## Product Definition

Atlas is an AI-native Decision Intelligence Platform. The first product module is Atlas Invest, focused on global AI infrastructure research. The long-term platform must also support industry research, ERP intelligence, supply-chain monitoring, M&A research, and board reporting.

## Core Modules

1. Atlas Invest: public company and investment research.
2. Atlas Industry: industry and supply-chain intelligence.
3. Atlas ERP Intelligence: internal business performance intelligence.
4. Atlas M&A: acquisition target research and synergy analysis.
5. Atlas Board: board packs, KPI reviews and strategic memos.

## High-Level Architecture

```text
Data Sources
  -> Ingestion Layer
  -> PostgreSQL / Object Storage / Search / Vector Store / Knowledge Graph
  -> Research Engine / Scoring Engine / Valuation Engine
  -> AI Agent Runtime
  -> Dashboard / Reports / Alerts / API
```

## Engineering Principles

- Documentation as code.
- Evidence-first research.
- Versioned prompts.
- Versioned scoring logic.
- Human review for important scoring and rating changes.
- Clear separation between facts, assumptions and analysis.
- Modular architecture that can expand beyond investing.

## Sprint 000 Scope

Sprint 000 creates the foundation only:

- Repository structure
- Documentation structure
- Development standards
- Initial architecture
- Initial database model
- Initial task briefs for Codex and Claude Code
- CI/CD plan
- Environment variable convention
- Logging convention
- Testing convention

No product feature should be built until Sprint 000 is accepted.

## MVP Scope

The first MVP should include:

- Company database
- Industry taxonomy
- Manual company profile creation
- Basic scoring engine
- Basic research report generator
- Company dashboard
- Watchlist
- Alert framework
- AI agent prompt library
- Research evidence log
