# P026 — Glove Sector Merge (glove-tracker → Atlas)

**Status:** planned (Phase 1 in execution) · **Owner:** Claude Code · **Date:** 2026-07-21

## Mission

Merge the owner's private repo `weisiang329-eng/glove-tracker` — "Malaysia
glove stocks intelligence · cycle-signal tracker · CF Workers + D1 backend" —
into Atlas as the second industry vertical (after AI infrastructure),
without losing its data, provenance discipline, or cycle-intelligence ideas.

## What glove-tracker contains (surveyed 2026-07-21)

- **Stack:** Vite+React (JS) dashboard + CF Worker + D1 — same platform as Atlas.
- **Schema:** `sectors`, `stocks` (Bursa/Yahoo codes, tier, fiscal year end),
  `global_players` (regions MY/CN/others), `prices` (15-min cron),
  `commodities` (NBR latex, natural latex, brent, natural gas, MYR/USD),
  `fundamentals` (quarterly; revenue/COGS/GP/OP/NP, eps_sen, **ASP USD/1000
  pcs, sales volume, capacity, utilisation**, forex, cycle_note, `is_mock`
  flag, `source_url`, `retrieved_at`), plus macro news, MD&A metrics,
  inferences (cycle signals), news severity, market-cap currency.
- **Data:** real rows marked `is_mock=0` with per-row source URLs (Bursa PDFs
  in `pdfs/`, stockanalysis.com scrapes in migrations like
  `_new_glove_fundamentals.sql`, `_foreign_fundamentals.sql`,
  `_cn_real_fundamentals.sql`); full-table dumps in `data/_ru0_full.json`.
  Mock rows exist too (`is_mock=1`) — **never import those**.
- **Coverage:** MY big-4 (TOPGLOV, HARTA, KOSSAN, SUPERMX), MY mid/small
  (CAREPLS, COMFORT, …), foreign (ANSELL, INTCO, BLUESAIL, MARK, ZHPULIN).
- **Philosophy (keep):** "不做決策，只把事實擺清楚" — every number has source
  link + retrieval time; missing shows `—`, never fabricated. Identical to
  Atlas database principles.

## Merge phases

### Phase 1 — coverage + fundamentals (PR `feat/glove-sector`)

1. New industry `rubber-gloves` ("Rubber & Medical Gloves", sector
   "Healthcare Manufacturing") in the Atlas seed.
2. Companies: big-4 first (Top Glove, Hartalega, Kossan, Supermax; MYR,
   Bursa tickers 7113/5168/7153/7106), then Ansell/Intco/others as data is
   extracted.
3. Import **quarterly** `financial_period`+`financial_fact` rows from
   glove-tracker's real data (`is_mock=0` only). Mapping:
   `revenue_mil→Revenue`, `cogs_mil→CostOfRevenue`,
   `operating_profit_mil→OperatingIncome`, `net_profit_mil→NetIncome`
   (native currency, unit millions). Each period's `source` row: kind
   `glove-tracker`, url = the row's `source_url`, retrievedAt preserved.
   Extractor script checked in at `apps/api/seed/glove/` so the import is
   reproducible from the glove-tracker repo.
4. Extend `apps/web` `STATIC_UNIVERSE` (static params for company pages).
   Quarterly results pages become live for glove names (first real quarterly
   data in Atlas).

### Phase 2 — industry intelligence (feeds P006) — v1 DELIVERED 2026-07-21 (PR #31)

Delivered:
- `industry_metric` table (industry-level time series, keyed by metric_key).
- Imported MARGMA Malaysian glove ASP (28 pts) + NBR latex cost (31 pts) from
  glove-tracker, provenance per point.
- `domain/industry.ts` cycle-signal engine: output-price ÷ input-cost indexed
  to cycle start = 100 (the margin proxy). `GET /v1/industries/:id{,/metrics}`.
- `/industries` live taxonomy + `/industries/[id]` workspace (cost/price/cycle
  charts, KPI grid, member companies).

Remaining (Phase 2 v2):
- Value-chain map (who supplies whom) — needs P007 knowledge graph.
- Capacity / utilisation / volume metrics per company (glove-tracker has them).
- Brent / natural-gas / FX daily series (large — the glove-tracker `_*_max.sql`
  dumps exceed the GitHub contents API; pull via git clone when importing).
- A dedicated `commodity` table split if `industry_metric` gets crowded.

### Phase 3 — intelligence & automation (feeds P011/P022)

- Port cron scrapers (prices, commodities, news) into Atlas Workers Cron.
- Port `inferences` (cycle signals) + news severity into the research/alert
  model. MD&A metrics → research_evidence.
- Retire glove-tracker frontend; archive the repo with a pointer to Atlas.

## Rules

- Provenance is non-negotiable: no `is_mock=1` row, no unsourced figure.
- Native currency preserved (MYR/AUD/CNY/IDR); no silent FX conversion.
- glove-tracker repo stays untouched until Phase 3 archival (read-only source).

## Stop conditions

Phase 1 stops at fundamentals + universe. No commodity tables, no scrapers,
no new UI pages in Phase 1 — those are Phase 2/3 PRs.
