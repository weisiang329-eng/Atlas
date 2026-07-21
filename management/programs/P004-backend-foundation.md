# P003/P004 — Backend Foundation & Financial Intelligence Engine

**Status:** delivered (PR open) · **Owner:** Claude Code · **Date:** 2026-07-21

## Mission

Land the real backend under the delivered frontend: Cloudflare-native API +
database + a Financial Intelligence Engine, and replace the mock demo with
live data for the Atlas Invest coverage universe.

## Architecture (locked)

| Layer | Choice | Rationale |
| --- | --- | --- |
| API | Hono on Cloudflare Workers (`apps/api`) | All-Cloudflare mandate; same stack as owner's other systems |
| DB | Cloudflare D1 (SQLite) via Drizzle ORM | CF-native, `wrangler` one-command deploy, no external dependency |
| Frontend | Next.js static export on CF Pages (unchanged) | Already live; wiring is additive via the prepared loader seam |
| Future | R2 (filings), Vectorize (semantic search), Queues+Cron (P022), Workers AI (P020) | Stays inside one `wrangler` ecosystem |

This supersedes PR #4 (raw Node + Prisma scaffold): Prisma does not fit
Workers/D1, and the health-only server did not advance any contract.

## Data model — facts, not tables of rows

`schemas/database-v0.md` principles realised:

- `source` — provenance for every value (`kind`: seed | sec-edgar | manual | estimate).
- `industry` — taxonomy (sector → segment).
- `company` — coverage universe; fields mirror the frontend `Company` contract.
- `financial_period` — one fiscal year/quarter per row (label, type, currency, unit, source).
- `financial_fact` — canonical `concept → value` per period (positive magnitudes;
  presentation sign applied at render). Concept catalog:
  `apps/api/src/domain/concepts.ts` (maps 1:1 onto XBRL tags for future EDGAR ingestion).

**The engine computes everything server-side** (frontend rule: no computation
in UI): statements are *rendered* from facts by spec
(`src/domain/statements.ts`), ratios/metrics derived in `src/domain/ratios.ts`,
presented into UI contracts in `src/domain/presenters.ts`. Missing input →
`undefined` → dropped row/ratio or `—`, never fabricated.

## API surface (v1)

```
GET /health
GET /v1/industries
GET /v1/companies                      → Company[] (frontend contract)
GET /v1/companies/:id                  → profile
GET /v1/companies/:id/financials       → periods+statements+metrics+ratioGroups+trends (one call)
GET /v1/companies/:id/statements/:type → income-statement | balance-sheet | cash-flow
GET /v1/companies/:id/metrics          → MetricRow[]
GET /v1/companies/:id/ratios           → RatioGroup[]   (P004 ratio dashboard)
GET /v1/companies/:id/results?period=annual|quarter → ResultRow[]
```

Response shapes are byte-compatible with `apps/web` mock contracts
(`StatementRow`, `MetricRow`, `RatioGroup`, `SeriesPoint`, `ResultRow`).

## Seed data (v0 coverage)

10 real AI-infrastructure companies × ≤4 annual periods, 463 facts, each linked
to a `kind='seed'` source row: NVIDIA, TSMC (TWD), AMD, ASML (EUR), Broadcom,
Micron, SK hynix (KRW, income-only), Intel, Arista, Vertiv. Figures are
approximate values from public filings, seeded manually pending automated
ingestion (P022); the source note says exactly that.

Generator: `apps/api/seed/data.mjs` (structured, concept-checked) →
`node seed/generate.mjs` → idempotent `seed/seed.sql` (INSERT OR REPLACE).

## Verification (done locally, 2026-07-21)

```
npm install                                  # repo root
cd apps/api
npx wrangler d1 migrations apply atlas-db --local
npx wrangler d1 execute atlas-db --local --file=seed/seed.sql
npx wrangler dev --port 8787
```

Verified: NVDA FY25 gross 75.0% / net 55.8% / growth +114.2% / current 4.4x /
interest coverage 330x — all match reported figures; statement signs and
sections correct; sparse coverage (SK hynix) degrades to income-only;
loss years (Micron FY23, Intel FY24) compute negative margins; EPS
split-adjusted (NVDA 2.94, AVGO, ANET); 404s clean; typecheck green.

## Deployment (owner action required)

The Worker + D1 need the owner's Cloudflare auth once:

```
cd apps/api
npx wrangler d1 create atlas-db      # paste database_id into wrangler.toml
npx wrangler d1 migrations apply atlas-db --remote
npx wrangler d1 execute atlas-db --remote --file=seed/seed.sql
npx wrangler deploy                  # note the workers.dev URL
```

Then set `NEXT_PUBLIC_API_BASE_URL=<worker URL>` in the Pages build
environment and redeploy the web app.

## Stop conditions

- Do not add auth/write endpoints in this program (read-only public data).
- Do not compute ratios in the UI — extend the engine instead.
- Schema changes only via `drizzle-kit generate` migrations.
