# Atlas — Take-Over Handoff

**Read this first.** It is the single self-contained guide to take over Atlas.
You do not need any prior chat context. Last updated 2026-07-21.

---

## 1. What Atlas is

Atlas is the owner's private **AI-native decision-intelligence platform**. v1
("Atlas Invest") is investment research across **global AI-infrastructure**
(semis / GPU / HBM / foundry / networking / data-center power) and **Malaysian
rubber-glove** stocks. Every number is sourced; nothing is fabricated; missing
data renders as "—". Later stages extend into enterprise/ERP intelligence and
autonomous research agents (see the roadmap).

## 2. Status in one paragraph

The platform is **fully built and verified locally**, delivered as **18 stacked
pull requests (#26–#43), all CI-green, none merged yet, and not yet deployed.**
Stage 1 (core intelligence) and Stage 2 (investment MVP) are complete, plus a
Claude AI analyst. The database was migrated from Cloudflare D1 to **Supabase
Postgres** (owner's choice). The only remaining work to go live is the
**owner-only deploy** (Cloudflare + Supabase auth) and one **pending decision**
(how login works). Everything else buildable-without-external-resources is done.

## 3. Repo & getting all the code

- **GitHub:** `weisiang329-eng/Atlas` · **local clone:** `Desktop/Atlas`
- **The branch `feat/supabase-postgres` contains the ENTIRE project** (all 18
  PRs are stacked; its tip = the complete, final code with Supabase Postgres).
  To work on everything: `git checkout feat/supabase-postgres && git pull`.
- **PR #43** targets `main` and also contains the entire stack — **merging #43
  into `main` lands all the code in one merge.** **PR #26** (branch
  `docs/management-plans`) holds the planning/handoff docs (this file included);
  it touches only `management/`, `tasks/`, `prompts/`, so it merges cleanly
  alongside #43. **After merging #43 + #26, `main` has everything.**

## 4. The 18-PR stack (merge order = ascending)

| PR | Branch | Delivers |
| --- | --- | --- |
| #26 | docs/management-plans | All planning docs, this handoff, runbook, execution status |
| #27 | feat/backend-foundation | Hono API + financial engine + AI-infra seed (originally D1) |
| #28 | feat/web-live-wiring | Frontend wired to live API (all financials/companies pages) |
| #29 | feat/glove-sector | Glove sector: 7 MY makers, 555 Bursa quarterlies |
| #30 | feat/edgar-ingestion | SEC EDGAR ingestion (105 annual periods, 2,441 facts) |
| #31 | feat/glove-industry-intel | P026 Phase 2: ASP/NBR series + margin cycle signal |
| #32 | feat/company-intel-p005 | P005 company overview + profile |
| #33 | feat/scoring-p010 | P010 Atlas Score (4-factor engine + rankings) |
| #34 | feat/knowledge-graph-p007 | P007 knowledge graph (supply chain) |
| #35 | feat/home-p009 | P009 investment cockpit (Home) |
| #36 | feat/watchlist-p011 | P011 watchlist |
| #37 | feat/reports-p013 | P013 auto company reports |
| #38 | feat/agent-p020 | P020 Claude research analyst |
| #39 | feat/portfolio-p012 | P012 portfolio |
| #40 | feat/value-chain-p006 | P006 AI-hardware value chain |
| #41 | feat/research-p008 | P008 research notes + decision journal |
| #42 | feat/company-relations | Relations tab on company pages |
| **#43** | **feat/supabase-postgres** | **DB migrated D1 → Supabase Postgres (tip = everything)** |

> The old Codex PR **#4** (Node+Prisma scaffold) is superseded — close it.

## 5. Architecture / stack

- **API:** Hono on **Cloudflare Workers** (`apps/api`).
- **Database:** **Supabase Postgres** via Drizzle (`drizzle-orm/postgres-js`).
  The Worker opens one `postgres.js` connection per request over the Supabase
  **transaction pooler** (port 6543, `prepare:false`), read from the
  `DATABASE_URL` Worker secret.
- **Web:** Next.js **static export** on **Cloudflare Pages** (`apps/web`).
  Fully DB-agnostic — it only calls the API over HTTP.
- **Data model:** financial **facts** (concept→value per period); the engine
  (`apps/api/src/domain/*`) derives statements, metrics, ratios, scores. **All
  computation is server-side; the UI never computes.**
- **Frontend data path:** `loader → apiFetch<T> → Resource<T> → <DataState>`
  (client fetch; see `docs/00-foundation/integration-points.md`).
- **AI agent:** `apps/api/src/agent/*` — Claude tool-use loop over read-only
  data tools; key = `ANTHROPIC_API_KEY` Worker secret.
- **Coverage today:** 17 companies, 2 sectors, 3 data sources (manual seed /
  SEC EDGAR / glove-tracker), ~4,000 facts.

## 6. Run & test locally

```bash
git checkout feat/supabase-postgres && npm install   # repo root
cd apps/api
npm run seed:build     # regenerate the 5 seed .sql files (deterministic)
npm run db:test        # apply migration + seeds to PGlite (real Postgres, WASM) and verify
npm run typecheck
cd ../web && npm run typecheck && npm run build       # static export → apps/web/out
```

`npm run db:test` is the key safety net: it proves the Postgres schema + all
seeds are valid and correct without any external database (17 companies, ~4k
facts, NVDA FY26 215,938, idempotent re-seed). It runs in CI on every PR.

There is **no local Postgres**; for live local dev put `DATABASE_URL` +
`ANTHROPIC_API_KEY` in `apps/api/.dev.vars` (see `.dev.vars.example`) and run
`wrangler dev`, or just point the web app at the deployed API.

## 7. Deploy to production (owner-only — the path to "live")

Full step-by-step: **`management/deployment/production-runbook.md`**. Summary:

1. `wrangler login` (owner's Cloudflare).
2. In the Supabase SQL editor, run in order: `apps/api/drizzle/0000_init_postgres.sql`,
   then the 5 seeds (`seed/seed.sql`, `seed/edgar/edgar-seed.sql`,
   `seed/glove/glove-seed.sql`, `seed/glove/industry-metrics.sql`,
   `seed/graph/graph-seed.sql`).
3. `wrangler secret put DATABASE_URL` (Supabase **transaction pooler** URL, port
   6543) and `wrangler secret put ANTHROPIC_API_KEY`.
4. `cd apps/api && wrangler deploy` → note the workers.dev URL.
5. Set `NEXT_PUBLIC_API_BASE_URL` (that URL) on the Pages project →
   `cd apps/web && npm run build && wrangler pages deploy out`.

**Supabase project:** `fsbcltowqpfniodzaslo` (owner's). It is **not** reachable
from the Supabase MCP connector used previously (different org — that connector
only exposed the owner's *Houzs* projects, which must never be touched).
**Security:** the DB password was shared in chat once — rotate it in Supabase
after setup and re-run `wrangler secret put DATABASE_URL`.

## 8. Pending decision — login / access

The app has **no built-in auth** (single-user design) and is **mobile-responsive**
(open the deployed URL on a phone). The owner wants a login + phone access.
Two options, awaiting the owner's pick:

- **A — Cloudflare Access (Zero Trust):** email-code login gate on the Pages
  domain, no code, works on phone. Fastest; recommended for launch.
- **B — Supabase Auth:** a real in-app login page (email+password / multi-user)
  built with Supabase's auth. A real feature to build (login UI + session +
  route protection + API JWT verification) — **not yet built**; would be a new PR.

## 9. What's built vs blocked (all programs)

Full detail + v1 designs + unblock requirements:
**`management/roadmap/execution-status-2026-07-21.md`**. Summary:

- **Delivered:** Stage 1 (P003/04/05/06/07/08, P022, P026) + Stage 2
  (P009/10/11/12/13) + P020 agent.
- **Buildable next (no blocker):** P022 v2 quarterly EDGAR ingestion; P010 v2
  percentile scoring & valuation; P021 agent memory (Supabase pgvector);
  P023 decision-outcome tracking.
- **Blocked on an owner-supplied resource:**
  - **P027 real-time markets** — needs a market-data API key (Polygon/Finnhub),
    set as `MARKET_DATA_KEY`. US equities only (no Bursa retail feed).
  - **P028 trading execution** — needs a broker account with an API (moomoo
    OpenAPI / IBKR / Alpaca) **and** an always-on `trading-bridge` host
    (Cloudflare Workers cannot host OpenD/IB Gateway). Manual-confirm only,
    paper-first — never auto-trade.
  - **Stage 3 (P014–P019, ERP intelligence)** — needs read access to the
    owner's ERP data (API / export / shared DB).
  - **Stage 4 (P021/P023/P024/P025)** — memory/learning/automation/1.0.

## 10. Key files to read (the map)

- **This file** — take-over guide.
- `management/roadmap/execution-status-2026-07-21.md` — every remaining program.
- `management/deployment/production-runbook.md` — how to deploy.
- `management/programs/*.md` — per-program specs (P004/P005/P020/P022/P026…).
- `prompts/full-modular-design-v1.md` — the architect prompt to design all
  remaining modules (incl. brand guide, IA, markets & trading).
- `schemas/database-v0.md` — the ~40-entity data-model direction.
- `docs/00-foundation/*` — design tokens, layout, component catalog,
  integration-points (the frontend data seam).
- Code entry points: `apps/api/src/index.ts` (routes), `apps/api/src/domain/*`
  (engines), `apps/api/src/db/schema.ts` (Postgres schema),
  `apps/web/lib/loaders/use-api.ts` (frontend loader), `apps/web/lib/types.ts`
  (API contracts).

## 11. Conventions (must follow)

- **Facts are magnitudes**; presentation applies sign. Missing data → "—",
  never fabricated. Every value links to a `source` row.
- **All computation in `apps/api/src/domain`.** The UI renders; it never
  computes a financial number.
- **Seeds are idempotent** Postgres upserts generated by `.mjs` scripts (edit
  the generator, run `npm run seed:build`, never hand-edit the `.sql`). CI runs
  `npm run db:test` — keep it green.
- **Frontend:** every view goes through `useApiResource` → `<DataState>`; no
  component calls `fetch` or holds a URL. Client-only lists (watchlist,
  portfolio, research notes) use localStorage hooks in `apps/web/lib/loaders`.
- **Continuity rule:** every milestone = a repo doc + a PR, so anyone can take
  over. Update this file when state changes.

## 12. Immediate next actions for whoever takes over

1. Merge **PR #43** (all code) + **PR #26** (all docs) into `main`; close #4.
2. Get the owner's **login choice** (§8) — if B, build Supabase Auth.
3. Run the **deploy runbook** (§7) with the owner's Cloudflare + Supabase auth.
4. Verify live (`/v1/scores`, Home shows 17 companies, `/agent` answers).
5. Then pick up the **buildable-next** queue (§9) or unblock P027/Stage 3 once
   the owner supplies the resource.
