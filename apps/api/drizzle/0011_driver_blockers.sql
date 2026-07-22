-- 0011 — every driver states WHAT IS BLOCKING IT, in one vocabulary.
--
-- Until now a driver's blocker lived in free text inside `source_name`
-- ("TrendForce (paid — out of scope)", "not yet ingested", "waiting on
-- EIA_API_KEY"). That reads fine and computes nothing: there was no way to ask
-- the database "what is actually pending, and what would each item unblock?"
-- — so the answer lived in three drifting lists instead (HANDOFF, the source
-- registry, and these strings).
--
-- `blocker` is that question, as data:
--
--   none            — has a series; already testable
--   needs-key       — a FREE key nobody has registered yet
--   needs-extraction— the numbers are in filings Atlas ALREADY STORES; this is
--                     code to write, not permission to get
--   paid            — behind a subscription, deliberately not bought
--   unavailable     — nobody publishes it, at any price
--
-- The distinction that matters most is needs-extraction vs paid. Half the
-- "blocked" drivers were never blocked on money at all.

ALTER TABLE industry_driver ADD COLUMN IF NOT EXISTS blocker text;
ALTER TABLE industry_driver ADD COLUMN IF NOT EXISTS source_id text;

-- ── Already testable ────────────────────────────────────────────────────────
UPDATE industry_driver SET blocker = 'none', source_id = 'glove-tracker'
  WHERE industry_id = 'rubber-gloves' AND key IN ('nbr_latex', 'asp_my');

-- ── A free key away ─────────────────────────────────────────────────────────
UPDATE industry_driver SET blocker = 'needs-key', source_id = 'eia'
  WHERE key IN ('natural_gas', 'electricity_price');
UPDATE industry_driver SET blocker = 'needs-key', source_id = 'fred'
  WHERE key IN ('copper_price', 'auto_industrial_inventory');

-- ── The numbers are already in the database; someone has to compute them ────
UPDATE industry_driver SET blocker = 'needs-extraction', source_id = 'derived-filings'
  WHERE key IN (
    'maker_capex', 'fab_capex', 'customer_capex', 'backlog_ratio',
    'bit_shipment_growth', 'hyperscaler_capex', 'datacenter_capex',
    'hbm_supply', 'gpu_shipments', 'utilisation'
  );

-- ── Behind a subscription, and deliberately not bought ──────────────────────
-- Price is the LAGGING half of the memory model (§3: "price is lagging
-- confirmation; inventory is the leading signal"). Paying five figures a year
-- for the lagging half, while the leading half sits uncomputed in filings we
-- already hold, is the wrong trade.
UPDATE industry_driver SET blocker = 'paid', source_id = 'trendforce'
  WHERE key IN ('contract_price', 'spot_contract_spread', 'hbm_price');
UPDATE industry_driver SET blocker = 'paid', source_id = 'semi-bookings'
  WHERE key = 'book_to_bill';

-- ── Nobody publishes it, at any price ───────────────────────────────────────
-- Kept anyway: a driver the model needs and cannot have is a stated limit of
-- the model, not an omission. Removing them would make the map look complete.
UPDATE industry_driver SET blocker = 'unavailable'
  WHERE key IN ('cowos_capacity', 'yield', 'new_fab_timeline',
                'port_speed_migration', 'new_capacity_mw');

-- Anything not classified above is treated as unclassified rather than
-- silently "fine".
UPDATE industry_driver SET blocker = 'unclassified' WHERE blocker IS NULL;

-- ── THE SUBSTITUTION ────────────────────────────────────────────────────────
--
-- `inventory_weeks` was the ★ leading driver for DRAM and NAND, and it was
-- specified as CHANNEL inventory — a TrendForce number. Channel inventory is
-- not obtainable for free, so the claim is restated as the maker's OWN
-- inventory days, which is computable today from stored facts:
--
--     DSI = Inventory ÷ CostOfRevenue × 91
--
-- This is a DIFFERENT MEASUREMENT and is described as one. Maker inventory
-- sits one step upstream of the channel: it moves later than distributor
-- stock and earlier than reported margin, and it is contaminated by
-- deliberate strategic builds. Naming it "channel inventory weeks" because it
-- is the closest thing we can get would be the substitution that quietly
-- changes what a claim means — the exact failure the proxy labelling in the
-- backtest exists to prevent.
DELETE FROM industry_driver WHERE key = 'inventory_weeks';

INSERT INTO industry_driver (
  industry_id, key, name, name_zh, what_it_is, phase, lag_quarters, affects,
  direction, target_metric, who_it_hits, series_key, frequency, kind,
  confidence, source_name, source_url, blocker, source_id
) VALUES
  ('memory-dram', 'inventory_days', 'Maker inventory days (DSI)', '厂商库存天数',
   '存货 ÷ 营业成本 × 91，直接从已入库的季度财报算出。注意这是厂商自己的库存，不是渠道库存：它比经销商库存晚动，比毛利率早动，而且会被厂商的策略性备货污染。渠道库存要付费买，这一条不用。',
   'leading', 2, 'Pricing',
   -1, 'gross_margin_pct',
   '固定成本高的厂：库存堆积时它们更早被迫降价。',
   'inventory_days', 'quarterly', 'assumption', 0.3,
   'Derived from stored filings (Inventory ÷ CostOfRevenue)', NULL,
   'needs-extraction', 'derived-filings'),
  ('memory-nand', 'inventory_days', 'Maker inventory days (DSI)', '厂商库存天数',
   '同 DRAM 的算法，但终端结构不同（企业级 SSD 与手机，而非 PC 与服务器 DRAM），所以拐点时点不一样。',
   'leading', 2, 'Pricing',
   -1, 'gross_margin_pct',
   '全行业。',
   'inventory_days', 'quarterly', 'assumption', 0.3,
   'Derived from stored filings (Inventory ÷ CostOfRevenue)', NULL,
   'needs-extraction', 'derived-filings')
ON CONFLICT (industry_id, key) DO UPDATE SET
  name = EXCLUDED.name, name_zh = EXCLUDED.name_zh,
  what_it_is = EXCLUDED.what_it_is, blocker = EXCLUDED.blocker,
  source_id = EXCLUDED.source_id, series_key = EXCLUDED.series_key;
