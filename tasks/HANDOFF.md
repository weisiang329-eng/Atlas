# Atlas — Take-Over Handoff

**This file = current state and what's next.** For the rest of the picture:

| File | What it gives you |
| --- | --- |
| [`CLAUDE.md`](../CLAUDE.md) | Rules: stack, conventions, commands, definition of done |
| [`docs/INVESTMENT-METHODOLOGY.md`](../docs/INVESTMENT-METHODOLOGY.md) | **The analytical model** — factors, weights, thresholds, known limitations |
| [`docs/CODEBASE-MAP.md`](../docs/CODEBASE-MAP.md) | Where everything lives and why |
| [`docs/METHODOLOGY.md`](../docs/METHODOLOGY.md) | How we work: worktree → PR → review → merge → deploy |

You do not need any prior chat context. Last updated 2026-07-23.

---

## 1. What Atlas is

Atlas is the owner's private **AI-native decision-intelligence platform**. v1
("Atlas Invest") is investment research across **global AI-infrastructure**
(semis / GPU / HBM / foundry / networking / data-center power) and **Malaysian
rubber-glove** stocks. Every number is sourced; nothing is fabricated; missing
data renders as "—". Later stages extend into enterprise/ERP intelligence and
autonomous research agents (see the roadmap).

## 2. Status in one paragraph

**Live and deployed** at the URLs in §7, on `main` — the "18 stacked PRs, none
merged" era ended 2026-07-21. Stage 1 (core intelligence), Stage 2 (investment
MVP), the Claude analyst, the trade ledger and the industry-intelligence layer
are all merged. **What is running in production is older than `main`:** the
Worker self-migrates its schema on a cold start, but the code and the web build
only change when someone deploys, and nothing has been deployed since
2026-07-21. Everything buildable without an external key, a subscription or a
deploy is done; what is left is in `GET /v1/pending` and §13.

> ⚠️ **The owner is testing the LIVE site and seeing the OLD build.** On
> 2026-07-23 they clicked a `/news` item that didn't navigate and asked why
> there was no China news — both are the DELETED mock (`#` links, US/TW/MY
> only), still live because nothing has deployed since 2026-07-21. Every
> "why is it still sample data / why doesn't it click" question resolves on
> deploy. **This is the single most valuable action outstanding.**
>
> **Deploying is now one command.** `main` is verified deployable-green
> (typecheck + `db:test` + web build all pass as of 2026-07-23). Because the
> environment already exists, an update needs no Supabase SQL and no secrets —
> the Worker self-migrates. Run `npx wrangler login` once, then
> `.\scripts\redeploy.ps1`. Full detail:
> [`management/deployment/redeploy-update.md`](../management/deployment/redeploy-update.md).

### What landed 2026-07-23 (PRs #82–#93)

| | |
| --- | --- |
| **News** | `/news` wired to the real feed; the mock that quoted MARGMA on glove ASP is deleted |
| **Industry tree** | 21-node taxonomy, split by drivers; membership rolls up; breadcrumbs never print a level number |
| **Drivers** | Claims with phase/lag/elasticity + a joint backtest that can say NO — and did: the latex claim is **contradicted** on 2019–2026 data |
| **Driver list** | §3's lists encoded — 32 drivers across 10 leaves, each naming the feed it needs |
| **Quarter alignment** | US industries had **empty** quarterly histories (no `report_date` anywhere); 存储 recovered 68 quarters |
| **Sourcing policy** | [ADR](../adr/ADR-Data-Sourcing-Cost.md): free at the margin, no per-industry subscriptions — convention #8 |
| **Derived series** | Inventory days + capex computed from stored filings; 5 drivers became testable for free |
| **Share-count gate** | It was deleting stock splits, not errors — 32 correct facts were being dropped on every regeneration |
| **Percentile scoring** | P010 v2 — a relative rank ("97th /17") alongside the absolute score; owner thresholds untouched |
| **Domain tests** | graph + cycle-signal covered (supply direction, honest YoY); db:test now 22 suites |

**Three findings from that day worth reading before trusting anything:** the
glove latex claim does not survive its own backtest (§ INDUSTRY-INTELLIGENCE
§5); every US industry's quarterly margin history was silently empty; and 14
taxonomy pages 404'd in production while the build reported success. All three
were found by *running the thing*, not by tests passing.

## 3. Repo

- **GitHub:** `weisiang329-eng/Atlas` · **local clone:** `Desktop/Atlas`
- Everything is on `main`. The old stacked-PR instructions (#26–#43, “check
  out feat/supabase-postgres to get everything”) are obsolete: that stack
  merged 2026-07-21 and those branches are deleted. PRs #44–#90 followed it.
- Work happens in a worktree per task — see `docs/METHODOLOGY.md`.

## 4. History

The original 18-PR stack and its merge order are in the git log, not here; a
handoff should say what IS, not narrate how it arrived. Recent work: §2.

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

## 7. Deploy to production — **LIVE as of 2026-07-21**

- **Web:** https://atlas-web-2yd.pages.dev (Cloudflare Pages project `atlas-web`)
- **API:** https://atlas-api.weisiang329.workers.dev (Cloudflare Worker `atlas-api`)
- **Database:** Supabase project `fsbcltowqpfniodzaslo`, migrations 0000+0001 and
  all 5 seeds applied via the SQL editor (17 companies, 3,982 facts, 23 graph
  edges, 59 industry-metric points, matches `db:test`).
- Both secrets (`DATABASE_URL` — transaction pooler, port 6543 — and
  `ANTHROPIC_API_KEY`) are set on the Worker; `/v1/agent/status` reports
  `configured: true`.

**Updating the LIVE environment (the common case):** one command —
`npx wrangler login` once, then `.\scripts\redeploy.ps1`. No Supabase SQL, no
secrets (the Worker self-migrates). See
**`management/deployment/redeploy-update.md`**.

Full step-by-step for a **fresh** environment (once only):
**`management/deployment/production-runbook.md`**.

**Supabase project:** `fsbcltowqpfniodzaslo` (owner's). It is **not** reachable
from the Supabase MCP connector used previously (different org — that connector
only exposed the owner's *Houzs* projects, which must never be touched).
**Security — outstanding, deliberately deferred by the owner (2026-07-21):**
the DB password and the Anthropic key were both shared in chat once during
setup. **Rotate both once the frontend/mobile work below has landed and the
app is stable** — reset the Supabase DB password (Settings → Database →
Reset database password) and re-run `wrangler secret put DATABASE_URL`;
regenerate the Anthropic key at console.anthropic.com and re-run
`wrangler secret put ANTHROPIC_API_KEY`. Do not treat "not urgent" as "skip."

## 8. Login / access — **LIVE, but wide open (owner's explicit choice for now)**

**DECIDED 2026-07-21: Option A — Cloudflare Access (Zero Trust).** Configured
on the Pages domain: Application `atlas-web-2yd` → Policy **"Everyone" /
Action = Bypass**. Bypass means Access enforces **no authentication at all** —
anyone with the URL gets straight in, no email, no click. This was the
owner's explicit choice ("谁都可以进ok啊之后我们才做user权限" — open now,
real permissions later), not an oversight.

**To lock it down later** (Cloudflare One → Access controls → Applications →
`atlas-web-2yd` → Policies): change the policy Action from **Bypass** to
**Allow**, and set Include to **Emails** (remove the `Everyone` include rule —
Bypass policies reject a mixed Emails+Everyone include, so this requires
editing, not just toggling). Cloudflare's default login method then prompts
for an email one-time PIN. Option B (Supabase Auth, in-app multi-user login)
remains a possible later upgrade if password-based login is wanted instead.

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
- `management/deployment/redeploy-update.md` — update the LIVE env in one
  command (`scripts/redeploy.ps1`); the common case.
- `management/deployment/production-runbook.md` — how to deploy a fresh env.
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

1. ~~Merge **PR #43** (all code) + **PR #26** (all docs) into `main`; close #4.~~
   **DONE 2026-07-21** — main has everything; #4 closed, #27–#42 marked merged.
2. ~~Get the owner's **login choice** (§8).~~ **DONE — A (Cloudflare Access).**
3. ~~Run the **deploy runbook** (§7).~~ **DONE 2026-07-21** — API + web + DB all live (§7).
4. ~~Verify live.~~ **DONE** — `/v1/scores`, `/v1/companies/nvidia/financials`, Home
   (17 companies), `/v1/agent/status` all verified 200 against the live Worker.
5. **Outstanding, deliberately deferred (owner, 2026-07-21):** rotate the
   Supabase DB password + the Anthropic API key (both were shared in chat
   during setup) — do this once the frontend/mobile work below is stable, not
   before. See §7.
6. ~~Aurora frontend refresh + mobile.~~ **DONE 2026-07-21** (PRs #46, #49 and
   the mobile commit): Aurora Glass tokens + chart grammar, 15 new module
   pages (markets, trading, ERP + children, CEO, board, agent ops, admin +
   children, news, memory, learning, research evidence/hypotheses/versions),
   live pages restyled with wiring untouched, and the mobile overhaul (bottom
   tab bar, card lists, phone-first chrome). **254 static pages** (was 195),
   deployed and verified live at 375×812. Plan:
   `management/plans/2026-07-21-aurora-frontend-mobile.md`.
7. Remaining: the exhaustive UI sweep (§13.3) — every page not covered by the
   design handoff still needs the Aurora grammar applied and, where it is a
   placeholder, real sample UI. Then the backlog below (§13).

## 13. Complete remaining-work backlog

Everything not yet done, exhaustively, by priority. Tick as you go.

### 13.1 To go live (must-do, owner-gated) — **ALL DONE 2026-07-21**
- [x] Merge PR #43 (code) + PR #26 (docs) → `main`; close Codex PR #4.
- [x] Owner picks login: **A — Cloudflare Access** (no code, §8).
- [x] Deploy: Supabase SQL (migration 0000+0001 + 5 seeds) → both Worker secrets set → `wrangler deploy` (atlas-api) → `wrangler pages deploy` (atlas-web).
- [x] Smoke-test live: `/v1/scores`, `/v1/companies/nvidia/financials`, `/v1/companies`, `/v1/agent/status` — all 200.
- [ ] **Rotate the Supabase DB password + the Anthropic API key** (both shared in chat during setup) — deliberately deferred by the owner until the frontend/mobile work is stable (§7). Do not forget.

### 13.2 Production hardening — **DONE 2026-07-21** (PR #45)
- [x] **CORS**: `ALLOWED_ORIGINS` env allowlist (unset ⇒ permissive), see `apps/api/src/index.ts`.
- [x] **Agent rate-limiting**: `agent_usage` table, per-IP/day quota enforced before calling Claude (`AGENT_DAILY_LIMIT`, default 50).
- [x] **`ALLOWED_ORIGINS` is set** (PR #71). Production had been serving
  `Access-Control-Allow-Origin: *`, so any page on the internet could read
  `/v1/scores` and `/v1/pms/book` — the trade ledger — out of a visitor's
  browser. With no login yet, CORS was the only control there. Now
  `https://atlas-web-2yd.pages.dev` plus `*.atlas-web-2yd.pages.dev` (the
  wildcard covers per-deploy preview URLs), in `wrangler.toml [vars]` because
  it is a reviewable policy, not a credential. **Add a custom domain there the
  day one is pointed at the site, or the app will stop loading data.**
- [ ] `AGENT_DAILY_LIMIT` still runs on its default (50/IP/day); tighten if the
  agent starts costing real money.
- [ ] **Observability**: enable `wrangler tail` review / an error sink; Supabase has logs.
- [x] **Secrets hygiene — audited 2026-07-22, the repo is clean.**
  All 136 commits scanned for `sk-ant-api03-…` keys and for Supabase pooler
  URLs carrying a real password: **no match**. The only credential-shaped
  strings anywhere are placeholders — `.dev.vars.example` (`PASSWORD`), the
  runbook (`[PASSWORD]`), and a long-deleted `.env.example` pointing at
  `atlas:atlas@localhost`. `.dev.vars`, `apps/api/.dev.vars`, `.env` and
  `.env.local` are all gitignored, and no file matching `.dev.vars` / `.env` /
  `*.pem` / `*.key` has ever been committed.

  **This narrows the rotation task rather than cancelling it.** The DB
  password and the Anthropic key were exposed in CHAT, not in git, so the
  blast radius is the conversation transcript — not a public repository, and
  not the deploy history. Rotation is still required (§7); it is simply not a
  public-exposure emergency.
- [ ] Consider Cloudflare **Access** even if login = B, to gate staging.

### 13.3 Frontend — pages still on MOCK or placeholder (wire to real data)

> **Visual status (2026-07-21):** the Aurora Glass system, 15 new module pages
> and the mobile experience have all landed — see §12.6. The pages below are
> about **data**, not looks: they render real UI on labelled sample data and
> still need wiring to the backend. Separately, the **exhaustive UI sweep** of
> every remaining route (Aurora grammar on pages the design handoff never
> covered, plus real UI for anything still a `ComingSoon` stub) is the one
> visual item outstanding — branch `feat/aurora-sweep`.

Live already: Home, Companies list + overview/profile/financials/relations, all
`/financials/*`, Industries + `/industries/[id]`, Value Chain, Rankings,
Watchlist, Portfolio, Research overview + notes + decision-journal, Knowledge +
graph, `/reports/company/[id]`, Agent, **News**. **Still not real:**
- [x] **`/news` — wired 2026-07-22.** Reads `GET /v1/news` (routes/news.ts +
  domain/news.ts); `lib/mock/news.ts` deleted, and with it an item attributed
  to **MARGMA** — a real trade association — carrying a specific glove-ASP
  number. That is a fabricated citation in all but name, and it was live.
  The mock's priority/URGENT tier, category and country columns are gone too:
  nothing computes them, so a badge saying URGENT on a real headline was a
  claim Atlas could not support. `components/news/related-news.tsx` was dead
  code on the same mock and was deleted rather than rewired.
  - **Measured, and it corrects a claim this repo made in three places:** a
    ticker-scoped Yahoo feed drifts badly. Of 100 stored items, **30** mention
    a covered company; the NVDA feed carries SpaceX and Moderna pieces. So
    `query` is rendered as provenance ("from the NVDA feed"), never as a tag,
    and the page shows the 30/100 ratio instead of hiding the 70.
  - **Follow-ups — all three closed 2026-07-23:**
    - [x] **(a) Scheduled refresh (PR #98).** `src/index.ts` now exports
      `{ fetch, scheduled }`; the pull moved to `ingest/run-news.ts` so the
      manual `POST /v1/ingest/news` and the Cron tick run the identical path.
      `wrangler.toml [triggers] crons = ["0 */6 * * *"]`. Takes effect on the
      next deploy — Cron does not fire against the current prod build.
    - [x] **(b) Per-company news panel (PR #97).** `CompanyNews` on the company
      overview reads `GET /v1/news?company=<id>`.
    - [x] **(c) Tagging recall (PR #96).** `companyTerms` peels legal /
      descriptor suffixes and `NEWS_ALIASES` covers TSMC / Hynix, so "Nvidia",
      "Micron" and "TSMC" tag as readily as the legal name; word boundaries
      keep precision.
- [ ] `companies/[companyId]/products` — needs a `company_product` table + data (P005 v2).
- [ ] `companies/[companyId]/management` — needs `company_management` table + data (P005 v2).
- [ ] `companies/[companyId]/valuation` — needs valuation multiples (needs price → P027) (P010 v2).
- [x] `companies/[companyId]/documents` — **honest now (PR #100).** Was a fixed
  fabricated filing list shown on every real company; now a `<PlannedModule>`
  stating the shape + blocker (filings in R2 + a source_document/filing table).
- [x] `companies/[companyId]/timeline` — **honest now (PR #100).** Was four
  invented dated events (incl. an "Overweight" rating action) on every company;
  now a `<PlannedModule>` (needs a company_event table). `mock/timeline.ts` and
  `mock/documents.ts` deleted.
- [ ] `research/reports`, `research/evidence`, `research/versions`, `research/hypotheses` — mock; part of P008 v2 (source-linked, versioned, needs write-auth).
- [ ] `reports/` (library) + `reports/[reportId]` — mock library; make it list the real per-company reports (`/reports/company/[id]`) + saved reports.
- [ ] `knowledge/heatmap`, `knowledge/decision-tree` — mock viz; wire heatmap to real exposure, decision-tree to P008 decisions.
- [ ] `alerts/` — placeholder (ComingSoon); needs P011 alerts (price/metric/news rules) → depends on P027 prices.
- [ ] `admin/` — placeholder; build if/when multi-user (depends on login B).
- [ ] After wiring each, delete the corresponding `apps/web/lib/mock/*` entry.

**Owner feedback on `/news` (2026-07-23) — two decisions pending:**
1. **A news item does not open a detail view.** By design, the new page links a
   headline OUT to the source article (Atlas stores only title + link, not the
   body — copyright/storage, see `ingest/news.ts`), and links a company chip
   INTO that company's page. There is no in-app "news detail". If the owner
   wants an internal detail view (e.g. one company's news history plus Atlas's
   own tags/analysis), that is a new feature to scope — it was raised, not yet
   decided.
2. **No China news, because no Chinese company is covered.** The feed is
   ticker-scoped to the 17 covered names (US semis + TSMC/ASML/SK hynix + MY
   gloves); none is mainland-China- or HK-listed. The geography tag vocabulary
   (`#中概` `#港股` …) already exists in `INDUSTRY-INTELLIGENCE.md` but no
   company uses it. Adding Chinese names is a **coverage decision (owner picks
   the list)**. Caveat per the sourcing ADR: a name with a US ADR gets filings
   (SEC) and news (ticker feed) for free; a pure A-share/HK name has **no free
   real-time quote** (same wall as Bursa), so it can carry financials + news
   but not live price.

### 13.4 Buildable next — no external blocker (server-side value)
- [x] **Industry taxonomy is a tree (2026-07-23)** — step 1 of
  `docs/INDUSTRY-INTELLIGENCE.md` §7. `industry` gained `parent_id`, `level`
  and `name_zh`; 21 nodes (2 roots · 3 chain segments · the 7 industries · 9
  sub-industries) ship in migration `0007_industry_tree.sql`, so the deployed
  Worker applies them on its next cold start. `apps/api/seed/taxonomy.mjs` is
  the written source of truth and `seed/test-taxonomy.mjs` fails the build if
  the database drifts from it.
  - **Membership rolls up** (`domain/taxonomy.ts`): 半导体 reports the 7
    companies filed under 存储/代工/设备. Without it every node above a leaf
    reads as an empty industry. The industries page computes its aggregates
    over *filed* nodes only — summing every node would have reported the
    17-company universe three times over.
  - `GET /v1/industries/tree` is new; `/v1/industries` gained `path`,
    `parentId`, `level`, `directCompanyCount`; `/v1/industries/:id` gained
    `path` and `children`. Breadcrumb renders 科技 › 半导体 › 存储 › DRAM and
    **never the level number** — that is schema vocabulary.
  - **Open decision for the owner:** companies still sit on the seven L3
    nodes. The design says a company is filed on a LEAF, but Micron makes
    DRAM, NAND *and* HBM, so re-filing is a judgement call, not a migration.
    Roll-up means nothing is blocked by leaving it.
- [x] **Driver model + backtest (2026-07-23)** — §7 step 2's *mechanism*.
  `industry_driver` (migration 0008), `domain/drivers.ts`,
  `GET /v1/industries/:id/drivers`, and a driver panel that shows every claim
  next to its verdict. Seeded for **gloves only**: the one leaf where both
  sides of a claim exist in the database. 17 db:test suites.
  - **Drivers are estimated JOINTLY.** Tested one at a time, the glove data
    says rising latex RAISES margin (+4.3 pp per +10%) — the 2020–21 ASP spike
    leaking into everything that moved with it. Coefficients are partial
    effects now, and the regression is on changes, not levels.
  - **First real finding: the latex claim does not survive.** Holding ASP
    fixed, 2019Q4–2026Q1 (n=26, R²=0.45), latex is **+2.98 pp per +10%**
    against a claimed −3~−4, and the sign flips across lags
    (`0q +3.27 · 1q +2.98 · 2q +1.39 · 3q +0.01 · 4q −1.30`). The honest
    reading is that this sample cannot resolve it. The claim stays on the page
    marked contradicted — deleting it would erase the finding.
  - What would settle it: **gross** margin (Bursa filers report revenue and
    net income only, so the test runs on a labelled net-margin proxy), volume
    or utilisation to separate price from demand, and a longer pre-2019
    window. All data problems.
- [x] **Fiscal-quarter alignment (2026-07-23, migration 0010) — a silent hole,
  found by observation.** The EDGAR seed writes **402 quarterly periods with no
  `report_date`** (the column is not in the INSERT, in the seed *or* in the
  ingest route). `quarterOf(null)` returns nothing, so every US industry's
  quarterly margin history was **empty**, and the driver backtest reported
  "insufficient data" for a reason that had nothing to do with the data.
  - `company.fiscal_year_end_month` + `domain/fiscal.ts`: a period is placed on
    the calendar by its filed date where one exists, otherwise **derived** from
    (fiscal year, fiscal quarter, fiscal year end) — fiscal quarters end three
    months apart from the year end, so this is arithmetic, not a guess. No
    invented date is ever written into `report_date`.
  - Recovered: 存储 **68 quarters (2008Q4–2026Q2)**, 加速器 72, 网络 52,
    数据中心电力 29 — all previously zero. Gloves unchanged at 95 with
    `derived: 0`, because their Bursa periods already carry filed dates.
  - The API reports `derivedQuarters` and `unplacedPeriods` on the target, so a
    reader can see how the history was assembled.
  - **Only sourced fiscal calendars are set.** The seven US filers come from
    the EDGAR roster; Top Glove (August) and Hartalega (March) are stated in
    their own seed descriptions. TSMC, ASML, SK hynix, Kossan, Supermax,
    Careplus, Comfort and Hextar are left NULL — a plausible guess would
    misplace every quarter by up to three months, and a wrong series that still
    looks like a number is worse than an absent one.
  - **Follow-up:** the ingest route should write the REAL period end from SEC
    (`extractQuarters` has it and drops it). Then live-ingested quarters stop
    needing derivation at all. `semis-equipment` still shows 0 quarters because
    ASML is its only member and has no quarterly periods seeded.
  - ✅ **The `seed:build` share-count trap is fixed (2026-07-23).** Regenerating
    dropped **32 `DilutedShares` facts**, only some of them bad: NVIDIA Q1 FY10
    `0.542` is the documented 1000×-too-small defect, but NVIDIA `2490`, Arista
    `~316` and Broadcom `~429` are correct and were being deleted too.
    **Cause:** SEC's companyfacts carries the ANNUAL share count *split-
    adjusted* by later filings while the quarterly keeps the count as
    originally filed — so after NVIDIA's 10-for-1 the two differ by exactly 10×
    with both correct, and the plausibility band (0.5×–2× vs annual,
    0.2×–5× vs median) deleted whichever side of the split was shorter. The
    band is now 0.01×–100× via `isImplausibleShareCount`, which still catches a
    1000× unit error and leaves every split intact; ten assertions in
    `test-quarters.mjs` pin both halves.
    - **The lost facts come back on the next `refresh.mjs`**, which needs
      network access to SEC — `facts.json` is the post-filter artefact, so the
      values cannot be restored offline. Run it when convenient; the checked-in
      SQL is currently AHEAD of `facts.json` by those 32 facts, so **do not
      regenerate `edgar-seed.sql` until the refresh has run.**
    - Still open and unchanged: **split-adjusting historical share counts** so
      EPS is comparable across a split (§13.6). Widening the gate stops data
      loss; it does not make pre- and post-split EPS the same units.
- [x] **Driver list encoded (2026-07-23, migration 0009) — needs owner review.**
  §3's 领先/同步/滞后 lists are now rows: **30 drivers across 10 leaves**
  (DRAM · NAND · HBM · 先进/成熟制程 · 设备 · 加速器 · 网络/ASIC ·
  数据中心电力 · 手套). Nothing invented — where §3 states no elasticity the
  band stays NULL. All are `assumption`; only the two glove drivers have a
  series, and every other row **names the feed it needs**, so the table is
  also the data shopping list:
  - **free, needs a key** — FRED (auto/industrial inventory, copper), EIA
    (electricity, natural gas)
  - **derivable from filings Atlas already stores** — maker capex, fab capex,
    customer capex, backlog ratio: extraction work, not a new source
  - **paid, out of scope** — TrendForce/DRAMeXchange (DRAM/NAND contract +
    spot, HBM pricing), SEMI book-to-bill
  - **may never be a series** — HBM stacking yield (qualitative commentary)
  - **Drivers roll DOWN as well as up:** companies sit on 存储 while the
    drivers hang off DRAM/NAND/HBM, so an industry page shows its descendants'
    drivers labelled with their node. Each node is backtested as its own joint
    model — pooling them would invent a control that does not exist.
  - **Owner review needed:** the doc disagrees with itself on the latex lag
    (§2 says leading/1q, §3 files it as coincident). The seed encodes §2; the
    lag profile now shows what the data supports at each lag.
  - **Next (§7 step 3):** wire FRED/EIA/BNM so the other leaves get series —
    FRED and EIA keys are still the blocker (§13.10).
- [x] **P022 v2** — quarterly EDGAR ingestion is live. `POST /v1/ingest/edgar`
  (optionally `?company=<id>`) pulls SEC companyfacts through `politeFetch`
  and writes 402 quarters / ~8,560 facts for the seven US names. Flow figures
  use the reported 3-month value where published and YTD-differencing
  otherwise; quarters that cannot be derived honestly are omitted.
  Logic lives in `src/ingest/edgar-quarters.ts` and is shared with the offline
  seed generator via re-export shims, so the API and the seed cannot drift.
  - **KNOWN RESIDUAL:** 3 of 402 quarters (NVIDIA Q1 FY10, Q1/Q2 FY11) carry a
    diluted-share count ~1000x too small in SEC's own filed data, so those EPS
    cells read ±200–370. Revenue, net income and every other figure for those
    quarters are correct. Two plausibility gates (vs the annual figure, and vs
    the company's median) are in `reconcileQuarters` but are not catching
    these three; fixing it means tightening the median band or bounding EPS
    directly. Everything from FY12 onward is clean.
- [ ] **P022 v2** — ASML & TSMC ingestion (still on manual seed). **Probed SEC
  companyfacts 2026-07-22; the task is not what the line above assumed:**

  | | taxonomy | currency | forms | coverage |
  | --- | --- | --- | --- | --- |
  | ASML (CIK 937966) | **us-gaap**, no `ifrs-full` at all | **EUR** | 20-F, 20-F/A | 2008–2025 |
  | TSMC (CIK 1046179) | **ifrs-full** (334 tags) | **TWD** | 20-F, 6-K | — |

  So ASML needs no IFRS work; it is blocked only by two hardcoded assumptions
  in the existing pipeline. TSMC needs both.

  Three things must change in `src/ingest/edgar-*.ts`, and the currency one is
  the dangerous one:

  1. **Form filter.** `extractTag`/`extractTagQuarterly` accept only `10-K`
     and `10-Q`. Foreign private issuers file `20-F` (annual) and `6-K`
     (interim). Nothing is extracted today because of this line alone.
  2. **Currency.** The unit lookup is `units?.USD ?? units?.shares`, and the
     period rows hardcode `'USD'` / `'USD millions'`. **Reading EUR or TWD
     values into a USD-labelled period would be the worst defect this
     platform can produce** — a plausible number that is wrong by a factor of
     the exchange rate, silently poisoning every ratio, score and chart.
     Reporting currency must come from the filing and be stored per period;
     `financial_period.currency` already exists for this.
  3. **IFRS tag map** for TSMC only: `Revenue` /
     `RevenueFromContractsWithCustomers`, and the `ifrs-full` equivalents of
     the rest of `TAG_MAP`.

  Also note TSMC's quarterly comes via **6-K**, which is not a structured
  quarterly report the way a 10-Q is — expect the reconciliation gate in
  `reconcileQuarters` to drop years, and check that before trusting output.
- [x] **P010 v2 percentile scoring (2026-07-23)** — `domain/percentile.ts` +
  `/v1/scores` now carries a **relative** rank alongside the absolute score,
  and the Leaderboard shows a "Rank" column ("97th /17"). It is purely
  additive: the owner-blessed absolute thresholds are untouched, so no existing
  score moved. Honesty constraints in code + `test-percentile.mjs`: the
  percentile is within COVERAGE (peer count travels with every value, so
  "97th of 17" can't read as a market decile), a company is ranked for a factor
  only if it has it and doesn't pad others' denominators, mid-rank ties.
  Methodology doc §4.5. **Still open:** percentile *within value-chain stage*
  (§7.3 — a foundry vs a glove maker), and `score_history` persistence, which
  needs a snapshot cadence and so waits on the scheduled-job/deploy work.
- [ ] **P021** — agent long-term memory: Supabase **pgvector** over research notes / entity profiles; semantic search tool for the agent.
- [ ] **P023** — decision-outcome tracking: add outcome fields to the decision journal + a review view (feeds learning).
- [ ] **P013 v2** — PDF export of company reports; industry & portfolio reports.
- [ ] **P006 v2** — glove value chain (raw-material → manufacturing → distribution) once upstream suppliers are added; interactive flow diagram.
- [ ] **P026 Phase 2 v2 / Phase 3** — per-company capacity/utilisation metrics; brent/gas/FX daily series (git-clone glove-tracker for the big `_*_max.sql` dumps); port the cron scrapers to Workers Cron; cycle-signal inferences.
- [ ] **P024** — automation: scheduled report generation + data-quality checks via Workers Cron (needs deploy).
- [x] **Tests** — the four calculation engines are covered: `seed/test-ratios.mjs`,
  `test-scoring.mjs`, `test-statements.mjs`, `test-valuechain.mjs`, all wired into
  `npm run db:test` (11 suites) and therefore into CI. They pin the *documented*
  model, not just the code: factor weights (30/25/25/20) and the grade cuts are
  asserted against `docs/INVESTMENT-METHODOLOGY.md`, so changing a threshold
  without changing the document now fails the build — convention #0 became a
  mechanism instead of a promise. The honesty properties are pinned too: missing
  inputs are reweighted rather than imputed, ratios are `undefined` (never 0 or
  NaN), and expenses render negative from positive magnitudes.
  Writing them found a live production bug (a 500 on `statements/toString`) —
  post-mortem in `docs/METHODOLOGY.md` §7.
- [x] **Tests — the untested domain modules now covered (2026-07-23).**
  `test-graph.mjs` and `test-industry-signals.mjs` cover the two that had none:
  the knowledge-graph builder (supply DIRECTION — a customer must never read as
  a supplier, the exact inverse-arrow bug) and the cycle signal (YoY compares
  to a point ~a year back, not an arbitrary neighbour; the ASP÷cost ratio is
  only built from an overlapping price+cost pair and refuses a divide-by-zero).
  `presenters` and `fees` were already covered by earlier PRs.
- [ ] **Tests (remaining)** — the ROUTE layer has no dedicated HTTP-level suite.
  Most routes ARE exercised end-to-end by the domain suites that mount them via
  Hono (test-percentile, test-derived, test-taxonomy, test-fiscal all hit real
  routes against PGlite), but there is no suite whose job is the route contract
  itself. `domain/matching` is covered via test-pms.

### 13.5 Blocked — needs an owner-supplied resource
- [ ] **P027 real-time markets** — market-data API key (`MARKET_DATA_KEY`, Polygon/Finnhub). US equities only; no Bursa retail feed. Then: quotes adapter, price history, WebSocket/Durable-Objects fan-out, candle charts, watchlist/alerts go live.
- [ ] **P028 trading execution** — a broker API account (moomoo OpenAPI / IBKR / Alpaca) **and** an always-on `trading-bridge` host (not Cloudflare). Manual-confirm only, paper-first, full audit log — never auto-trade.
- [ ] **Stage 3 — ERP intelligence (P014–P019)** — read access to the owner's ERP data (API / nightly export to R2 / shared DB). Then: sales/SKU/customer/inventory/capacity ingestion, CEO dashboard, board pack.
- [ ] **Stage 4 — P025 Atlas 1.0** — integration/verification pass (unified nav, permissions, audit log, performance budget) once the above land.

### 13.6 Data quality / coverage gaps
- [ ] Coverage is 17 companies — expand the universe (add to `apps/api/seed/data.mjs` + `apps/web/lib/universe.ts`, keep them in sync).
- [ ] Sparse rows: SK hynix and the glove names are income-statement-only — add balance-sheet/cash-flow where available (their liquidity/leverage/cash factors are currently "—").
- [ ] EDGAR caveats (documented in `management/programs/P022-ingestion-edgar.md`): pre-split diluted-share counts for old years (EPS only split-consistent recently) → add a split-adjustment table; combined-SG&A filers render the total on the G&A row.
- [ ] **Split adjustment — DO NOT automate blindly (investigated 2026-07-23).**
  I looked at building EPS split-adjustment and stopped, because the data
  cannot support it safely yet. The share-count series is on **inconsistent,
  filing-dependent bases**: SEC restates the trailing 2–3 comparative years to
  the current split basis in each new 10-K, so where the series steps depends
  on which filing each year came from, not on the real split date. A naive
  "multiply by cumulative split ratio after the period" would double-adjust the
  already-restated years. Worse, **Arista's data shows TWO ~4× steps
  (FY2019 and FY2022) for a company that split 4:1 once** — one of them is
  almost certainly a restatement artefact, and there is **no free external
  anchor** to tell which. Shipping "split-adjusted EPS" on top of that would
  fabricate plausible-but-wrong numbers (convention #1). Correct sequence:
  (a) run the networked `refresh.mjs` so `facts.json` is current and complete,
  (b) hand-verify each covered company's split history against its filings,
  (c) store a per-company split table as reviewed reference data (like
  `fiscal_year_end_month`), (d) THEN adjust at presentation. Steps (a)–(b) need
  a human; do not skip them. Detection-from-data alone is not enough — it
  "confirms" the Arista double-step as real.
  - Note: revenue/margin/scores are **unaffected** (splits don't touch them),
    and per-period as-reported EPS is correct in its own period's units. The
    only thing that is wrong today is EPS *comparability across a split*, and
    nothing currently draws an EPS trend across periods, so the live blast
    radius is small — which is why this is a data-quality backlog item, not a
    fire.

### 13.7 Tech-debt / cleanup
- [ ] `apps/web/lib/mock/*` — delete each module as its page is wired (§13.3).
  `mock/news.ts` is gone (2026-07-22); `mock/timeline.ts` + `mock/documents.ts`
  gone (2026-07-23, PR #100); 22 modules remain. When deleting one,
  check for other importers — `related-news.tsx` was dead code hanging off the
  news mock and only surfaced because the mock went first.
- [ ] Remove the superseded `tasks/handoff-2026-07-21.md` once everyone uses this file.
- [ ] No CD — consider a GitHub Action to deploy on merge to `main` (after secrets are set in the CF/GH integration).
- [ ] Nav still tags `alerts`/`admin` as `soon` — correct until built.

### 13.8 Bilingual (zh default / en peer) — foundation done, copy migration open
Architecture is final (`lib/i18n/*`, PR #52); what remains is moving literal
strings into the dictionary. `Dict` is derived from the zh dictionary, so a
missing English key fails the build — the guard is automatic.
- [x] Foundation: dictionaries, `LocaleProvider`/`useT`, pre-paint locale script, Settings switcher.
- [x] Shell: sidebar/drawer nav, bottom tab bar, topbar.
- [x] Page headers: Home, Companies, Rankings, Watchlist, Portfolio; Home cockpit body.
- [ ] Live page bodies: Companies list/detail tabs, all `/financials/*`, Industries, Value Chain, Knowledge, Research, Reports, Agent.
- [ ] Adopted module pages (ERP, CEO, Board, Trading, Markets, News, Alerts, Admin, Agent Ops, Memory, Learning) — most already ship Chinese copy from the design handoff; move it into the dictionary so English works too.
- [ ] Shared UI: `DataTable` pagination/search, `DataState` messages, `EmptyState`/`PlannedModule` defaults, toast text, `CommandSearch`.
- [ ] Company sub-tab labels (keys exist in `COMPANY_TAB_KEYS`, not yet consumed by `companyTabs()`).
- [ ] Decide whether `<title>`/metadata should localise (currently English only; would need per-locale routes or client-side title updates).

### 13.9 UI layout rebuild (the design handoff was only half-applied)
The Aurora token layer and the NEW module pages came from the handoff, but the
already-live pages kept their Sprint-000 **layout** and only had utility classes
swapped — new paint on old bones. That is why the app still looked dated.
- [x] Home — rebuilt on the handoff's composition (KPI strip → wide/narrow pair → even pair), wired to real data, marketing card grid removed.
- [~] Companies list — **audited 2026-07-23: already a solid modern master-detail
  composition** (`FilterBar` + `DetailPanelLayout`, list + preview, Aurora
  tokens, active/focus states, monograms). It exceeds the spec's plain
  DataTable. This item was **stale** — Companies is not the "old bones" problem;
  do not rebuild it just to tick a box.
- [ ] Company detail — masthead + tab layout per the handoff.
- [ ] Rankings/Scores — leaderboard composition.
- [ ] Watchlist / Portfolio — card+table composition.
- [ ] Financials family — statement layout.
- [ ] Industries / Value Chain / Knowledge — workspace compositions.
- **Re-audit before rebuilding.** All these pages are thin (~19-line) wrappers
  delegating to `*Live` components that already use the modern composition
  primitives (`StatGrid`/`Panel`/`WorkspaceLayout`/`DetailPanelLayout`). At
  least Companies has already been rebuilt since this list was written. Check
  each `*Live` component's actual composition against the design before assuming
  it needs work.

**Verification — what the agent session CAN and CANNOT check (measured
2026-07-23, corrects the old "innerWidth = 0" claim):**
- ✅ **Structure, hierarchy, computed CSS, responsive** — `read_page`,
  `javascript_tool` and `resize_window` all work against the local dev server.
  Viewport reports **1280×720** (not 0); grid columns, gaps, max-widths and the
  full a11y tree are readable. So *structural conformance to a spec is
  verifiable* — a rebuilt page can be confirmed to have the KPI strip, the grid,
  the masthead, the right spacing tokens.
- ❌ **Pixel screenshots** still time out (`computer{action:"screenshot"}` after
  30 s). So *aesthetic* judgement — does it actually look good — still needs a
  human eye on a preview deployment.
- ❌ **Real data compositions** cannot be seen locally: pointing the dev server
  at the **live API** gets the request **CORS-blocked** (`ALLOWED_ORIGINS` is
  the Pages domain, not localhost), so data-dependent pages (scores, financials,
  populated tables) collapse to their error/empty state. Seeing a leaderboard or
  a statement table full of real rows needs a **local API**, which needs the
  Supabase `DATABASE_URL` (owner-gated). Pages with a static-universe fallback
  (Companies list, PlannedModule pages) render without it.

**Practical consequence:** an agent can faithfully implement a page to the
design spec and verify its *structure* — but cannot self-certify that it looks
right or see it full of real data. The remaining rebuilds are best done either
(a) with the owner eyeballing each on a preview deploy, or (b) after the owner
grants local API/DB access so real-data compositions render. Do not churn
already-modern pages blind.

### 13.11 External data sources — what is connected, and the waiting list

**Reachability was measured, not assumed.** `GET /v1/ingest/probe` fetches every
candidate source *from the Worker* and reports the status. This matters: a
source that works from a laptop can still fail in production, and one did —
Google News RSS returns **503 to Cloudflare Workers specifically**, the only
one of eight free sources that blocks datacentre egress. Re-run the probe before
adding any source.

**Connected — free, no key, working in production:**

| Source | Serves | Notes |
| --- | --- | --- |
| **BNM** (Bank Negara Malaysia) | The ledger's FX anchor | Middle rate + the dealer half-spread, stored separately (PORTFOLIO-ACCOUNTING §5). USD/MYR verified live. |
| **Yahoo Finance RSS** | News Research Analyst, `/news` | Ticker-scoped — which constrains the query, **not the content**. Measured 2026-07-22: 30 of 100 stored items mention a covered company; the rest is general market copy arriving under a ticker. Tags come from matching the headline, never from the query. |
| **SEC EDGAR** (`data.sec.gov`) | Company financials | Already the basis of US coverage. |
| **SEC EDGAR filings atom + full-text** | Company/Industry analysts | Probe-verified reachable; not yet wired to a route. |
| **World Bank** | Macro indicators for industry KPIs | Probe-verified; not yet wired. |
| **Frankfurter** | FX cross-check against BNM | Probe-verified; not yet wired. |

**Rejected:** Google News RSS — 503 from Workers. Superseded by Yahoo Finance
RSS, which is a better fit anyway.

### Derived series (2026-07-23) — five drivers became testable, for free

`domain/derived-series.ts` computes driver series from filings already stored
(tier 4 of [`adr/ADR-Data-Sourcing-Cost.md`](../adr/ADR-Data-Sourcing-Cost.md)):
**inventory days** (Inventory ÷ COGS × 91) and **capex**, on the memory leaves
and equipment. Each derivation carries a `measures` string that the UI renders
verbatim, because a substitute that stops saying what it is has become the
thing it replaced.

First results, from Micron + SK hynix against 存储's margin (n=61,
2011Q2–2026Q2): inventory days **−1.89 pp per +10%**, maker capex **−0.65**,
both `weak` (R²=0.078). Right signs, thin fits — the honest reading is a real
but noisy relationship, not a confirmed one.

Two mechanisms this needed:
- **Targets borrow upward.** DRAM holds no companies, so its margin history
  comes from 存储 and the response says `borrowed: true` with the node name.
  Equipment walks further: ASML *is* filed under 半导体设备 but Atlas holds no
  ASML quarterlies, so membership alone was not enough — the walk continues
  until a node actually has a history.
- **0012 corrected 0011's classification.** `needs-extraction` had become a
  comfortable place to file anything not obviously paid; writing the code
  proved most of it wrong. Now: 1 needs extraction (a real unmapped XBRL tag),
  3 need **coverage** (hyperscaler capex — free data, companies not tracked),
  6 more are `unavailable` (utilisation, bit growth, HBM supply, GPU shipments
  are earnings *commentary*, not structured filings).

**Caught by observation, not by tests — and it had already shipped:** the web
app is a static export, and `/industries/[id]` only pre-rendered the seven
industries in `STATIC_INDUSTRIES`. The taxonomy PR added 14 nodes, the tree
links to all of them, and **every one of those pages 404'd in production**
while the build kept reporting the same page count. `ALL_INDUSTRY_IDS` now
drives `generateStaticParams`, and `test-taxonomy.mjs` fails if a node is
missing from it.

### THE PENDING LIST LIVES AT `GET /v1/pending` — this section is a summary

It used to live in three places (here, the source registry, and free text
inside each driver's `source_name`), which is three chances to drift, and they
had. Every driver now carries a `blocker` in one vocabulary and the endpoint
groups them, sorted by what each item would unblock. **Do not add a fourth
list — add a row.**

**Re-measured against the seeded DB 2026-07-23 (late) — the earlier count was
wrong and is corrected here.** Loading migrations 0008–0012 into PGlite and
grouping `industry_driver.blocker` gives the authoritative figures below (the
script is trivial: `SELECT blocker, count(*) ... GROUP BY blocker`). The prior
table claimed "15 needs-extraction, the largest group, code nobody has
written" — but migration **0012** had already reclassified that group, and the
real numbers are very different. **needs-extraction is 1, not 15.**

Measured: **32 drivers · 7 testable (`none`) · 25 blocked.**

| Blocker | Drivers | What it actually needs |
| --- | --- | --- |
| **unavailable** | **12** | Nobody publishes it at any price — earnings *commentary*, not an XBRL fact (utilisation, bit-shipment growth, HBM supply, GPU shipments) plus the structurally-unpublished (CoWoS capacity, yield, fab ramp timing, port-speed migration, new DC capacity MW). No extraction produces these. |
| **none** (testable) | **7** | Already computed and shown: glove `asp_my` + `nbr_latex`, memory `inventory_days` ×2 and `maker_capex` ×2, equipment `fab_capex`. These are the derived-filings series in `domain/derived-series.ts`. |
| paid | 5 | Deliberately **not bought** (TrendForce/SEMI) — see convention #8. |
| needs-key | 4 | A FREE key: FRED (copper, auto/industrial inventory) ×2, EIA (electricity, natural gas) ×2. |
| **needs-coverage** | **3** | FREE data, companies not in the universe: `hyperscaler_capex` / `datacenter_capex` (MSFT/GOOGL/AMZN/META filings) and `customer_capex`. This is a coverage-expansion job (add the names to `seed/data.mjs` + a networked EDGAR ingest), **not** an extraction. |
| **needs-extraction** | **1** | `backlog_ratio` (dc-power-cooling / Vertiv) — the ONE genuine extraction. Needs `us-gaap:RevenueRemainingPerformanceObligation` added to `ingest/edgar-tags.ts` TAG_MAP, a `backlog_ratio` DERIVATION, **and** a networked `POST /v1/ingest/edgar` to backfill the RPO facts. The code is a small job; the data backfill needs network + the owner's DB, so no real series exists until then. `series_key` is still NULL. |

> **Why this correction matters:** the old "15 needs-extraction, largest group,
> just write code" line would send the next agent chasing work that does not
> exist — 0012 already proved 4 of those keys are earnings commentary
> (unavailable), 3 are coverage, and 3 were already extracted. The only
> extraction actually left is one network-gated driver. Do not re-inflate this
> number; re-run the GROUP BY against the DB if in doubt.

**Free keys still outstanding** (register, then `wrangler secret put <NAME>`):

| Priority | Service | Secret | Unblocks |
| --- | --- | --- | --- |
| **1** | [Finnhub](https://finnhub.io/register) | `FINNHUB_API_KEY` | **P027 in one stroke:** live quotes → unrealised P&L, valuation multiples in the Atlas Score (its biggest stated gap), alerts, price charts |
| **2** | [FRED](https://fredaccount.stlouisfed.org/apikeys) | `FRED_API_KEY` | 2 drivers now (copper, auto/industrial inventory) + macro series |
| 3 | [EIA](https://www.eia.gov/opendata/register.php) | `EIA_API_KEY` | 2 drivers (electricity, glove natural gas) |
| 4 | [Census M3](https://api.census.gov/data/key_signup.html) | `CENSUS_API_KEY` | Semiconductor inventories/shipments — the free stand-in for channel inventory |
| 4 | [Alpha Vantage](https://www.alphavantage.co/support/#api-key) | `ALPHAVANTAGE_API_KEY` | Backup quote source |

**DECIDED 2026-07-23 — we do not subscribe to TrendForce / DRAMeXchange /
SEMI**, and the general rule is now an ADR:
[`adr/ADR-Data-Sourcing-Cost.md`](../adr/ADR-Data-Sourcing-Cost.md) — sources
must be free **at the margin**, because a per-industry subscription model
makes 100 industries impossible and 10 uncomfortable. It is convention #8 in
`CLAUDE.md`. One research subscription per industry would cost more than
everything else in this platform combined, and the reasoning is not only about
price:

- **Price series are the LAGGING half of the memory model.** §3 says it
  outright — "price is lagging confirmation; inventory is the leading signal."
  Paying five figures for the lagging half while the leading half sits
  uncomputed in filings we already hold is the wrong trade.
- **SEMI stopped publishing the public book-to-bill years ago**, so paying
  does not even restore the series everyone quotes. Fab capex from filings
  leads equipment revenue by 2–3 quarters and is already in the database.

What replaces them, and what each substitute actually measures:

| Instead of | Use | Honest difference |
| --- | --- | --- |
| DRAM/NAND channel inventory weeks | **Maker inventory days (DSI)** = Inventory ÷ COGS × 91, from stored filings | The maker's OWN stock, not the channel's: moves later than distributor inventory, earlier than margin, and is contaminated by strategic builds. Shipped as `inventory_days`, described as exactly that. |
| DRAM/NAND contract & spot price | Census M3 semiconductor inventories/shipments; FRED semiconductor PPI | Sector-wide, monthly, not a memory contract price |
| HBM pricing, CoWoS capacity | TSMC/ASE **monthly revenue** via TWSE open data (verified free, no key) | Revenue, not capacity or price — a coincident read on the same constraint |
| SEMI book-to-bill | Fab capex from filings + Taiwan equipment makers' monthly revenue | Orders inferred from spend, not surveyed bookings |

Still genuinely out of scope: Bloomberg · Reuters · Drewry/Freightos ·
IATA. **Bursa Malaysia has no free retail feed at all** — Malaysian quotes
stay manual.

### 13.10 Portfolio accounting / trade book (PMS)
Model: `docs/PORTFOLIO-ACCOUNTING.md`. Foundation merged in PR #53.
- [x] Schema (0002), FIFO matcher, fee schedules per market, FX P&L split, 33 engine assertions in CI.
- [x] Decisions locked: base currency **MYR**, **FIFO**, fee schedule with per-trade override, FX anchored to **BNM mid-rate with the dealing spread booked separately as `fx_spread`**.
- [ ] API routes: trades CRUD, positions, closures, cash movements, reconciliation.
- [ ] BNM rate ingestion (public API) into `pms_fx_rate`, plus the spread capture on conversions.
- [ ] Trade ledger UI: entry form, 总仓 (position) view, 按订单 (by-lot) view with per-closure P&L.
- [ ] Fund statements: P&L, balance sheet, cash flow; monthly fee totals.
- [x] **API + database persistence** — `/v1/pms/book`, `POST /v1/pms/trades`, `DELETE /v1/pms/trades/:id`, `/v1/pms/fees/estimate`. The ledger UI was on localStorage, which is wrong for a book of record (one browser only, lost on cache clear) and impossible for the broker sync to write to.
- [x] **Schema now applies itself.** The Worker holds DATABASE_URL, so it runs pending migrations on a cold start (`src/db/migrate.ts`) — no more pasting SQL into the Supabase dashboard. Existing hand-provisioned schemas are BASELINED, not re-run.
- [ ] Moomoo daily sync — **unblocked in principle: the owner confirmed (2026-07-22) an always-on host will be available.** Still to build: the OpenD-side sync job, `POST /v1/pms/import` keyed on Moomoo's `deal_id`, and reconciliation. Manual entry stays first-class regardless.
- [ ] BNM mid-rate ingestion into `pms_fx_rate` (the FX anchor, PORTFOLIO-ACCOUNTING §5); the entry form currently uses indicative defaults the user can override.
- [ ] Corporate actions (splits, dividends affecting cost basis) — not yet modelled.
- [ ] Short positions — deliberately rejected today (oversell is reported, not silently shorted); needs an explicit design.
