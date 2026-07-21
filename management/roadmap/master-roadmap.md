# Atlas Master Roadmap

## North Star

Build the world's best AI-native Decision Intelligence Platform.

## Product Direction

Atlas starts with investment intelligence, but the platform must eventually support enterprise intelligence, ERP intelligence, manufacturing, supply chain, M&A, executive intelligence and board intelligence.

## Roadmap Stages

### Stage 0 — Foundation
Status: mostly complete

- Repository foundation
- Frontend foundation
- Backend foundation
- Development standard
- Report UX foundation
- Design system foundation

### Stage 1 — Core Intelligence
Status: in progress

Programs:

- P003 Core Intelligence Backend Engine — **delivered 2026-07-21** (Hono on CF Workers + D1 + Drizzle; see `management/programs/P004-backend-foundation.md`)
- UI P003 Enterprise Design System & Intelligence Workspace OS — delivered
- P004 Financial Intelligence Engine — **backend delivered 2026-07-21** (facts model + ratio engine + seeded universe); frontend live wiring in progress (`management/plans/web-live-wiring-plan.md`)
- P005 Company Intelligence Engine
- P006 Industry Intelligence Engine
- P007 Knowledge Graph Engine
- P008 Decision Engine
- P026 Glove Sector Merge — **new 2026-07-21**: merge `glove-tracker` repo as the second industry vertical (`management/programs/P026-glove-sector-merge.md`); Phase 2 feeds P006, Phase 3 feeds P011/P022

Goal:
Create reusable intelligence capabilities: source, evidence, research, financial, company, industry, knowledge and decision.

### Stage 2 — Investment Intelligence MVP
Status: planned

Programs:

- P009 Investment Workspace
- P010 Scoring & Valuation Framework
- P011 Watchlist & Alerts
- P012 Portfolio Intelligence
- P013 Company Report Automation

Goal:
Make Atlas useful as an investment intelligence platform.

### Stage 3 — Enterprise Intelligence
Status: planned

Programs:

- P014 ERP Intelligence
- P015 Manufacturing Intelligence
- P016 Procurement & Supply Chain Intelligence
- P017 Warehouse / Operations Intelligence
- P018 CEO Dashboard
- P019 Board Intelligence

Goal:
Extend Atlas from investment analysis into company operating intelligence.

### Stage 4 — AI-Native Intelligence Platform
Status: planned

Programs:

- P020 Agent Runtime
- P021 Memory Engine
- P022 Continuous Research Engine
- P023 Learning Engine
- P024 Automation Engine
- P025 Atlas 1.0

Goal:
Turn Atlas into a continuously learning AI-native decision intelligence platform.

## Engineering Rule

Programs should be large enough to support multiple PRs and at least several days of work.

## Platform Rule (owner directive, 2026-07-21)

Everything deploys to Cloudflare: Workers (API), D1 (database), Pages (web),
and later R2 / Vectorize / Queues / Cron / Workers AI. No other infrastructure.

## Continuity Rule (owner directive, 2026-07-21)

Every milestone lands as a plan doc in the repository plus a PR on GitHub, so
that any agent or person can take over at any point. Current state lives in
`tasks/handoff-<date>.md`.

## CTO Review Cadence

Every major program requires:

- PR review
- architecture review
- documentation review
- technical debt review
- roadmap update
