# Atlas — Codebase Map

Where everything lives and why. Written for someone who has never seen this
repo. Pair with `CLAUDE.md` (rules), `docs/METHODOLOGY.md` (how we work), and
`tasks/HANDOFF.md` (current state).

**Keep this file current.** If you add a directory or move a boundary, update
the relevant table in the same PR.

---

## 1. Ten-second orientation

```
Atlas/
├── CLAUDE.md              ← rules for working here (read first)
├── apps/
│   ├── api/               ← Hono on Cloudflare Workers + Supabase Postgres
│   └── web/               ← Next.js 15 static export on Cloudflare Pages
├── docs/                  ← how the system is built and designed
├── management/            ← plans, programs, roadmap, deployment runbook
├── tasks/HANDOFF.md       ← current state / what's next (read second)
├── schemas/ adr/ prompts/ agents/
└── package.json           ← npm workspaces root
```

Data flows one way, always:

```
Supabase Postgres → Drizzle (db/repo) → domain engines → presenters → JSON
   → apiFetch<T> → Resource<T> → <DataState> → React components
```

The UI never computes a financial number, and never fetches directly.

## 2. `apps/api` — the backend

| Path | Responsibility |
| --- | --- |
| `src/index.ts` | Worker entry: CORS (env allowlist), per-request Postgres connection, route mounting, error handling |
| `src/routes/` | HTTP layer only — parse, call domain, return. `companies` `industries` `scores` `graph` `agent` `pms` `ingest` (pull side) `news` (read side of the feed) `pending` (the one blocked-work list, computed from driver blockers) |
| `src/domain/` | **All computation lives here.** `statements` `ratios` `scoring` `industry` `graph` `valuechain` `concepts` (concept vocabulary) `presenters` (shape → API contract) `percentile` (cross-sectional rank, P010 v2) `news` (feed presentation: derived source, resolved tags) `taxonomy` (industry tree: paths, descendants, roll-up) `drivers` (causal claims + the joint backtest that checks them) `fiscal` (fiscal→calendar quarter alignment) `derived-series` (driver series computed from stored filings). Governed by `docs/INVESTMENT-METHODOLOGY.md` — the two must always agree |
| `src/db/schema.ts` | Drizzle Postgres schema — the tables |
| `src/db/repo.ts` | Typed queries. No formatting, no computation |
| `src/agent/` | `runtime.ts` (Claude tool-use loop) + `tools.ts` (read-only data tools) |
| `drizzle/` | Numbered SQL migrations. `0000_init_postgres.sql`, `0001_agent_usage.sql` |
| `seed/` | `.mjs` generators → deterministic `.sql`. `data.mjs` (AI-infra), `edgar/` (SEC), `glove/` (Bursa + industry metrics), `graph/` (relationships) |
| `seed/test-pg.mjs` | `npm run db:test` — applies migrations + all seeds to PGlite (real Postgres in WASM) and asserts row counts. **The safety net; runs in CI** |
| `wrangler.toml` | Worker config. Secrets are never here |

**Adding a data concept:** vocabulary in `domain/concepts.ts` → engine in
`domain/` → shape in `domain/presenters.ts` → route → mirror the type in
`apps/web/lib/types.ts`. Both sides change together.

## 3. `apps/web` — the frontend

| Path | Responsibility |
| --- | --- |
| `app/` | Next.js App Router. One directory per route; `page.tsx` composes layout + live component |
| `lib/api/client.ts` | `apiFetch<T>` — the only place a URL exists |
| `lib/resource.ts` | `Resource<T>` — loading / error / data envelope |
| `lib/loaders/use-api.ts` | `useApiResource` — the hook every live view uses |
| `lib/loaders/use-*.ts` | localStorage-backed lists (watchlist, portfolio, research) |
| `lib/types.ts` | API contracts — **must mirror the API presenters** |
| `lib/nav.ts` | Navigation model: `NAV_GROUPS` + per-workspace sub-tabs. Single source for sidebar, drawer, and bottom bar |
| `lib/mock/` | Labelled fictional sample data for not-yet-wired modules. Never real-company figures |
| `lib/format.ts` `lib/cn.ts` `lib/universe.ts` | Formatting, class merge, company universe (keep in sync with the API seed) |
| `components/ui/` | Primitives: panel, stat, badge, tabs, drawer, dialog, data-state, loading-state, kpi-card, empty/error states |
| `components/data/` | `DataTable` (sort, search, paginate, **`mobileCards`**), results table |
| `components/layout/` | `app-shell` `sidebar` `topbar` `bottom-tab-bar` `workspace-layout` `nav-groups` `command-search` |
| `components/chart/` | Pure-SVG charts: trend (glow), sparkline, bar-series, candlestick, intraday, donut, chart-container |
| `components/<domain>/` | Feature components — `*-live.tsx` = wired to the real API |
| `app/globals.css` + `tailwind.config.ts` | **Aurora Glass** design tokens. Never use a raw hex; always a token |

### Which pages are real vs sample

- **Live (real API data):** Home, Companies (+ overview/profile/financials/
  relations), all `/financials/*`, Industries, Value Chain, Scores/Rankings,
  Watchlist, Portfolio, Research notes + decision journal, Knowledge + graph,
  `/reports/company/[id]`, `/agent`.
- **Sample data (labelled mock):** Markets, Trading, Alerts, ERP (+children),
  CEO, Board, Agent Ops, Admin (+children), News, Knowledge Memory, Research
  Learning / Evidence / Hypotheses / Versions.
- When you wire a sample page to real data, delete its `lib/mock/*` module in
  the same PR.

## 4. Design system — Aurora Glass

Direction **1b "Aurora Glass"**. Spec: `docs/design-aurora/00-visual-refresh.md`;
mobile rules: `docs/design-aurora/00-mobile-responsive.md`.

Grammar, by class:

```
panel      rounded-panel border border-border bg-surface shadow-panel
inset well bg-surface-3 border border-border-soft
numbers    num tabular-nums            (Plex Sans, plain zero)
mono       tickers, eyebrow labels, code only
loading    .skeleton (shimmer, reduced-motion safe)
floating   .glass (topbar, bottom bar, drawers)
live tick  .flash-up / .flash-down
```

**Mobile:** one responsive codebase, no separate app. Below `lg` the sidebar is
replaced by `BottomTabBar` (5 slots, 52px targets, safe-area inset). Below `sm`
primary lists switch to cards via `<DataTable mobileCards />`; dense reference
tables (financial statements) deliberately keep horizontal scroll. Reference
frames: 375×812 and 1440.

## 5. Docs & management

| Path | What it holds |
| --- | --- |
| `docs/INVESTMENT-METHODOLOGY.md` | **the analytical model** — factors, weights, thresholds, limitations, and the rule for changing them |
| `docs/CODEBASE-MAP.md` | this file |
| `docs/METHODOLOGY.md` | worktree → PR → review → merge → deploy, and the review standard |
| `docs/00-foundation/` | architecture, design tokens, layout system, component catalog, integration points, development standard |
| `docs/design-aurora/` | the Cloud Design deliverable: visual refresh, mobile spec, and P003–P029 module designs |
| `management/plans/` | dated implementation plans |
| `management/programs/` | per-program specs (P004, P005, P020, P022, P026…) |
| `management/roadmap/` | execution status — every program, its state, and what unblocks it |
| `management/deployment/production-runbook.md` | full deploy procedure |
| `tasks/HANDOFF.md` | **current state, next actions, complete backlog** |
| `schemas/` `adr/` `prompts/` `agents/` | data-model direction, decisions, design prompts, agent specs |

## 6. Where to start for common jobs

| Job | Start here |
| --- | --- |
| Add a company | `apps/api/seed/data.mjs` + `apps/web/lib/universe.ts` (keep in sync) → `npm run seed:build` → `npm run db:test` |
| Add a metric/ratio | `domain/concepts.ts` → `domain/ratios.ts` → presenter → `web/lib/types.ts`, and document it in `docs/INVESTMENT-METHODOLOGY.md` §3 |
| Change a score factor/weight/threshold | `domain/scoring.ts` **and** `docs/INVESTMENT-METHODOLOGY.md` §4 in the same PR — never tune to move a company's rank |
| New API endpoint | `src/routes/` + a `domain/` function; never compute in the route |
| New page | route in `app/` + a `*-live.tsx` using `useApiResource` → `<DataState>` |
| Wire a sample page | replace `lib/mock/*` import with a loader; delete the mock |
| Change nav | `lib/nav.ts` only — all three navs derive from it |
| Restyle | tokens in `globals.css` / `tailwind.config.ts`, then component classes |
| Deploy | `management/deployment/production-runbook.md` |
| Pick up the project cold | `tasks/HANDOFF.md` |
