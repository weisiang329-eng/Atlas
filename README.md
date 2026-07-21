# Atlas Intelligence Platform

**Live:** [atlas-web-2yd.pages.dev](https://atlas-web-2yd.pages.dev) ·
API [atlas-api.weisiang329.workers.dev](https://atlas-api.weisiang329.workers.dev)

> ### 👋 New here? Read these four, in order.
>
> | # | File | What it gives you |
> | --- | --- | --- |
> | 1 | [`CLAUDE.md`](CLAUDE.md) | The rules: stack, conventions, commands |
> | 2 | [`tasks/HANDOFF.md`](tasks/HANDOFF.md) | Current state, what's next, full backlog |
> | 3 | [`docs/INVESTMENT-METHODOLOGY.md`](docs/INVESTMENT-METHODOLOGY.md) | **The analytical model** — what Atlas measures, claims, and cannot do |
> | 4 | [`docs/CODEBASE-MAP.md`](docs/CODEBASE-MAP.md) | Where everything lives and why |
> | 5 | [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) | How we work: worktree → PR → merge → deploy |
>
> Together they are self-contained — you need no prior chat context to take
> over this project.

Atlas is an AI-native Decision Intelligence Platform for investment, business strategy, industry research, supply-chain monitoring, ERP intelligence, M&A analysis, and board-level decision support.

## Mission
Build a long-term enterprise intelligence layer that helps leadership answer:

1. What is changing in the market?
2. Which companies, industries, suppliers, customers, and risks are affected?
3. What decision should management consider next?

## First Module
The first production module is **Atlas Invest**, focused on global AI infrastructure research:

- Semiconductors
- GPU / CPU / AI ASIC
- HBM / DRAM / NAND / SSD
- Foundry / packaging
- Networking / optical
- Data centers
- Cooling
- Power / grid / transformers
- Enterprise AI software

## Long-Term Modules

- Atlas Invest
- Atlas Industry
- Atlas ERP Intelligence
- Atlas M&A
- Atlas Board
- Atlas Supply Chain
- Atlas Research OS

## Development Principle
Atlas must be built as a 10-year platform, not a short-term prototype.

Before coding any major module, the team must define:

- Architecture
- Data model
- API contract
- Acceptance criteria
- Testing scope
- Security and audit requirements

## Repository Structure

```text
Atlas/
  apps/api/          Hono API on Cloudflare Workers + Supabase Postgres (Drizzle)
  apps/web/          Next.js 15 static export on Cloudflare Pages
  docs/              Codebase map, methodology, foundation docs, Aurora design system
  management/        Plans, programs, roadmap, production runbook
  tasks/             HANDOFF.md — current state and backlog
  schemas/           Data-model direction
  adr/               Architecture Decision Records
  prompts/ agents/   Prompt library and agent definitions
```

## Stack

Cloudflare Workers (API) · Cloudflare Pages (web) · Supabase Postgres (data) ·
Hono + Drizzle + TypeScript · Next.js 15 + Tailwind · Claude for the research
agent. Everything is Cloudflare + Supabase; no other infrastructure.

## Quick start

```bash
npm install
cd apps/api && npm run db:test      # verifies schema + all seeds on PGlite
cd ../web  && npm run build         # static export of every page
```

## Current Stage

**Live in production.** Stage 1 (core intelligence) and Stage 2 (investment
MVP) are delivered, plus the Claude research analyst, the Aurora Glass design
system, and the mobile experience. Coverage: 17 companies, 2 sectors, 3 data
sources, ~4,000 sourced facts.

See [`tasks/HANDOFF.md`](tasks/HANDOFF.md) §13 for the complete remaining
backlog, and [`management/roadmap/`](management/roadmap/) for per-program
status.
