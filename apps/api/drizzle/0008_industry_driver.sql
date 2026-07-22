-- 0008 — industry drivers: the causal layer.
--
-- Design: docs/INDUSTRY-INTELLIGENCE.md §2. A driver is a CLAIM about a
-- series, not the series: phase, lag and elasticity are what let the model be
-- checked and therefore be wrong in public. Drivers hang off leaves.
--
-- The seeded rows are gloves only, deliberately. It is the one leaf where both
-- sides of the claim exist in the database today (MARGMA ASP + NBR latex from
-- glove-tracker, and 555 Bursa quarterlies), so it is the only place the
-- backtest can actually run. Seeding the other six from prose would create
-- exactly what §5 warns against: claims nobody can check.
--
-- Every row starts as `assumption`. A claim becomes `fact` when a backtest
-- supports it — that promotion is a deliberate act, not a default.

CREATE TABLE IF NOT EXISTS industry_driver (
  id serial PRIMARY KEY,
  industry_id text NOT NULL REFERENCES industry(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  name_zh text,
  what_it_is text,
  phase text NOT NULL,
  lag_quarters integer NOT NULL DEFAULT 0,
  affects text,
  direction integer NOT NULL,
  elasticity_low double precision,
  elasticity_high double precision,
  elasticity_unit text,
  target_metric text,
  who_it_hits text,
  series_key text,
  frequency text,
  kind text NOT NULL DEFAULT 'assumption',
  confidence double precision NOT NULL DEFAULT 0.3,
  source_name text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS industry_driver_unq ON industry_driver (industry_id, key);

-- ── 手套 — a spread model: 利润 = ASP − (胶 + 天然气 + 人工) ──────────────
--
-- NOTE ON A DISAGREEMENT IN THE DESIGN DOC: §2's worked example gives NBR
-- latex `phase: leading, lagQuarters: 1`, while §3's glove block lists 胶价
-- under 同步 (coincident). The §2 example is the explicit driver definition,
-- so it is what is encoded here — and the backtest reports the lag it actually
-- finds, which is how the disagreement gets settled with evidence rather than
-- by editing prose.
INSERT INTO industry_driver (
  industry_id, key, name, name_zh, what_it_is, phase, lag_quarters, affects,
  direction, elasticity_low, elasticity_high, elasticity_unit, target_metric,
  who_it_hits, series_key, frequency, kind, confidence, source_name, source_url
) VALUES
  ('rubber-gloves', 'nbr_latex', 'NBR latex cost', 'NBR 丁腈胶乳',
   '手套的主要原料，占现金成本约一半；价格跟随丁二烯与原油。',
   'leading', 1, 'COGS',
   -1, -4, -3, 'pp margin per +10% move', 'gross_margin_pct',
   '低端手套厂 > 高端厂：转嫁能力不同，产品结构越低端受伤越深。',
   'nbr_latex', 'weekly', 'assumption', 0.4,
   'MARGMA / Maybank IB primers / ChemAnalyst (via glove-tracker)',
   'https://margma.com.my/'),

  ('rubber-gloves', 'asp_my', 'Malaysian glove ASP', '马来西亚手套均价',
   '行业出口均价，收入侧。价格是滞后确认：等 ASP 转正时，周期往往已经走了几个季度。',
   'lagging', 0, 'Revenue',
   1, NULL, NULL, NULL, 'gross_margin_pct',
   '全行业；高端厂 ASP 溢价更稳定。',
   'asp_my', 'monthly', 'assumption', 0.4,
   'MARGMA benchmark (via glove-tracker)',
   'https://margma.com.my/'),

  -- The two below have NO series yet, and that is the point of storing them:
  -- they state what the model is missing, and they name the blocker.
  ('rubber-gloves', 'natural_gas', 'Natural gas cost', '天然气成本',
   '烘干与成型的能源成本，马来西亚厂受管制气价与补贴调整影响。',
   'coincident', 0, 'COGS',
   -1, NULL, NULL, NULL, 'gross_margin_pct',
   '自有燃气锅炉、能耗高的老产线受伤更大。',
   NULL, 'monthly', 'assumption', 0.3,
   'EIA (waiting on EIA_API_KEY — no series ingested yet)',
   'https://www.eia.gov/opendata/'),

  ('rubber-gloves', 'utilisation', 'Capacity utilisation', '产能利用率',
   '开工率，需求侧最早的信号：客户去库存时利用率先掉，ASP 与毛利率随后。',
   'leading', 2, 'Volume',
   1, NULL, NULL, NULL, 'gross_margin_pct',
   '固定成本高的厂杠杆更大，利用率下滑对其单位成本冲击更快。',
   NULL, 'quarterly', 'assumption', 0.3,
   'Company filings (per-maker capacity/utilisation not yet ingested — P026 Phase 3)',
   NULL)
ON CONFLICT (industry_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  name_zh = EXCLUDED.name_zh,
  what_it_is = EXCLUDED.what_it_is,
  phase = EXCLUDED.phase,
  lag_quarters = EXCLUDED.lag_quarters,
  affects = EXCLUDED.affects,
  direction = EXCLUDED.direction,
  elasticity_low = EXCLUDED.elasticity_low,
  elasticity_high = EXCLUDED.elasticity_high,
  elasticity_unit = EXCLUDED.elasticity_unit,
  target_metric = EXCLUDED.target_metric,
  who_it_hits = EXCLUDED.who_it_hits,
  series_key = EXCLUDED.series_key,
  frequency = EXCLUDED.frequency,
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url;
