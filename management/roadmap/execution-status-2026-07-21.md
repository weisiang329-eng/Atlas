# Atlas Execution Status — 2026-07-21

## Update 2026-07-21 (late) — stack + PRs #39–#43

- Database migrated **D1 → Supabase Postgres** (PR #43; owner's Supabase
  `fsbcltowqpfniodzaslo`). Verified via PGlite in CI (`npm run db:test`).
- Delivered since this doc was written: P012 portfolio (#39), P006 value chain
  (#40), P008 research/decision (#41), company Relations tab (#42).
- **18 PRs total (#26–#43), all CI-green, none merged, not yet deployed.**
- Consolidated take-over guide: `tasks/HANDOFF.md`.
- Open decision: login = Cloudflare Access (A) vs Supabase Auth (B), see HANDOFF §8.


Snapshot of what is **built**, what is **buildable now**, and what is
**blocked on an external resource** (with exactly what unblocks it). Written so
any session can pick up any remaining program without re-deriving scope.

## Delivered this session (11 PRs, #26–#36)

| PR | Program | What shipped |
| --- | --- | --- |
| #26 | docs | Program docs, plans, handoff, roadmap |
| #27 | P003/P004 | Hono + D1 + Drizzle backend, financial engine, AI-infra seed |
| #28 | P004 fe | Live wiring — every financials/companies page on real data |
| #29 | P026 P1 | Glove sector: 7 MY makers, 555 Bursa quarterlies |
| #30 | P022 | SEC EDGAR ingestion — 105 annual periods, 2,441 facts |
| #31 | P026 P2 | Industry intelligence: ASP/NBR series + margin cycle signal |
| #32 | P005 | Company overview + profile live |
| #33 | P010 | Atlas Score: 4-factor engine, rankings, scorecard |
| #34 | P007 | Knowledge graph: supply-chain relationships + workspace |
| #35 | P009 | Investment cockpit (live Home) |
| #36 | P011 | Watchlist (localStorage) + live scorecard |

Coverage today: **17 companies, 2 sectors, 3 data sources** (manual seed /
SEC EDGAR / glove-tracker), deepest history 19 annual + 94 quarterly periods,
every value sourced.

## Buildable now (no external dependency — next sessions)

### P006 value-chain view (v2 of industry intelligence)
Now unblocked by P007. Render the industry's companies positioned along the
value chain using the relationship edges (design→foundry→memory→equipment→
networking→power). Backend: join `relationship` + `company.industryId`.
Frontend: a staged value-chain diagram on `/industries/[id]`. ~1 PR.

### P008 decision engine + research
Tables `research_note`, `hypothesis`, `decision_journal` (+ evidence links to
`source`). CRUD via API (first **write** endpoints — needs a write-auth
decision, see note below). Frontend: wire the existing `/research/*` pages
(notes/hypotheses/decision-journal) + DecisionTree viz. ~2 PRs.
Note: first module that writes. For a single-user platform, a shared-secret
header on write endpoints is enough for v1; real auth is a Stage-4 concern.

### P012 portfolio intelligence
Tables `holding` (company_id, shares, cost, date). Portfolio-level metrics:
weight, sector/industry exposure, weighted Atlas Score, concentration. Reuse
scoring + industry data. Frontend: `/portfolio` workspace (currently a
placeholder). localStorage v1 (like watchlist) or D1 v1. ~1 PR.

### P013 report automation
Assemble a company report from data already present: profile (P005) +
statements/ratios (P004) + Atlas Score + factors (P010) + relationships
(P007), rendered through the existing `ReportLayout` + 9 report blocks; export
to PDF via the make-pdf path or print CSS. Frontend: `/reports/[companyId]`.
No new data. ~1–2 PRs. **Highest-value buildable item** (produces the
board-ready artifact the product promises).

### P010 v2 valuation + percentile scoring
Add valuation multiples (P/E, EV/EBITDA, P/B) once market cap lands (needs
price — see P027), and cross-sectional percentile factor scores + persisted
`score_history` for versioning.

## Blocked on an external resource

### P027 real-time markets — needs a market-data API key
Architecture is ready to design (Durable Objects for WebSocket fan-out,
`price`/`quote` tables, provider adapter). **Blocker:** a quote source.
- US equities: Polygon / Finnhub / Twelve Data (free tier = 15-min delayed or
  limited WebSocket). **Unblock:** owner provides an API key (set as a Worker
  secret `MARKET_DATA_KEY`).
- Bursa (gloves): no good retail real-time feed exists; delayed EOD only.
v1 without a key: EOD close-price history seeded from a provider's REST, no
live tick. Candle chart component is net-new.

### P028 trading execution — needs a broker + a bridge host
- **Blocker 1 (broker):** an account with an API — moomoo OpenAPI / IBKR /
  Alpaca (US equities). Bursa retail has no execution API, so MY names stay
  signal-only.
- **Blocker 2 (host):** OpenD / IB Gateway are long-running processes that
  Cloudflare Workers cannot host. A small always-on `trading-bridge` service
  (owner's VPS/PC) holds the broker session + API keys; the Worker talks only
  to the bridge.
- **Safety (hard):** paper-trading default, order-ticket manual confirmation,
  D1 audit log, per-day limits. Atlas executes only user-confirmed orders;
  never auto-trades.
Design can be written now; nothing executes until both blockers are supplied.

### Stage 3 — enterprise / ERP intelligence (P014–P019) — needs ERP data access
Framework is designable (generic ERP-data-source adapter aligned to the
owner's Hono+D1 ERP schema: sales/orders/SKU/customers/inventory/capacity).
**Blocker:** a connection or export from the owner's ERP (read-only API, a
nightly dump to R2, or a shared D1). Until then, P014–P019 are design-only.
Once data lands, the same fact/engine/workspace pattern used for companies
applies directly (self-company as an "entity", KPIs, cycle signals, CEO
dashboard aggregating multiple owner companies).

### Stage 4 — AI-native (P020–P025) — design + Workers AI
- P020 agent runtime, P021 memory (D1 + Vectorize), P023 learning (predict vs
  actual, feeds off P008 decision journal), P024 automation (Cron report/alert
  generation), P025 Atlas 1.0 integration.
- P022 continuous research **v2** (buildable now, partial): quarterly EDGAR
  ingestion via YTD-differencing, IFRS mapping for ASML/TSMC 20-Fs, and moving
  `refresh.mjs` into a Workers Cron writing straight to D1. No external
  blocker — just scope.

## Recommended order for the next sessions

1. P013 report automation (highest visible value, no blocker).
2. P006 value-chain view + P012 portfolio (small, unblock P018 later).
3. P008 research/decision (first writes; establishes the write-auth pattern).
4. P022 v2 quarterly ingestion (deepens every company's data).
5. When keys/host arrive: P027 markets, then P028 trading.
6. When ERP access arrives: Stage 3.
7. Stage 4 as the platform matures.

## The two things only the owner can do

1. **Merge** PRs #27→#36 in order (#26 anytime; close the stale Codex #4).
2. **Deploy** to Cloudflare (one-time auth) — commands in
   `tasks/handoff-2026-07-21.md`. Nothing is publicly live until this runs.
