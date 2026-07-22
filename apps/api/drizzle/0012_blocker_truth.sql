-- 0012 — the blocker classification was wrong, and being wrong here matters.
--
-- 0011 marked 15 drivers `needs-extraction`, on the claim that the numbers
-- were already in `financial_fact` and only code was missing. Writing that
-- code proved most of them wrong: `needs-extraction` had become a comfortable
-- place to file anything that was not obviously paid, which is the same
-- failure as one word for five situations — just one level down.
--
-- What the derivation work actually established:
--
--   DERIVABLE TODAY (5) — inventory days and capex come straight out of
--     Inventory, CostOfRevenue and Capex, all stored, all quarterly.
--   NEEDS A NEW TAG + RE-INGEST (1) — backlog exists in XBRL
--     (RevenueRemainingPerformanceObligation) but is not in TAG_MAP, so it is
--     real extraction work, not a wish.
--   NEEDS COVERAGE (3) — the numbers are public and free, in filings of
--     companies Atlas does not track. Hyperscaler capex is the demand driver
--     for foundry, networking and accelerators, and MSFT/GOOGL/AMZN/META are
--     simply not in the universe yet. Adding them is a coverage decision.
--   UNAVAILABLE (6) — utilisation, bit shipment growth, HBM supply, GPU
--     shipments: disclosed in earnings COMMENTARY, not in any structured
--     filing. No amount of code produces them.
--
-- Correcting this is not bookkeeping. `needs-extraction` is the group the
-- owner is told needs nobody's permission; padding it with items that need a
-- coverage decision or that cannot be had at all makes the one honest
-- to-do list dishonest.

-- ── Derivable today: the series now exists, computed from stored filings ────
-- `series_key` has to be set as well as the blocker: it is the join to
-- DERIVATIONS, and a driver whose key is NULL silently resolves to no series
-- however derivable it is. That was the bug this line fixes.
UPDATE industry_driver SET blocker = 'none', source_id = 'derived-filings',
       series_key = 'inventory_days'
  WHERE key = 'inventory_days' AND industry_id IN ('memory-dram', 'memory-nand');
UPDATE industry_driver SET blocker = 'none', source_id = 'derived-filings',
       series_key = 'maker_capex'
  WHERE key = 'maker_capex' AND industry_id IN ('memory-dram', 'memory-nand');
UPDATE industry_driver SET blocker = 'none', source_id = 'derived-filings',
       series_key = 'fab_capex'
  WHERE key = 'fab_capex' AND industry_id = 'semis-equipment';

-- ── Real extraction work: a tag that exists but is not mapped ──────────────
UPDATE industry_driver
  SET blocker = 'needs-extraction',
      source_name = 'Filings — us-gaap:RevenueRemainingPerformanceObligation is not in TAG_MAP yet; add it and re-run POST /v1/ingest/edgar'
  WHERE key = 'backlog_ratio';

-- ── Needs coverage: free data, in companies Atlas does not track ───────────
UPDATE industry_driver
  SET blocker = 'needs-coverage',
      source_name = 'Hyperscaler filings (MSFT/GOOGL/AMZN/META) — free and quarterly, but these companies are not in the coverage universe'
  WHERE key IN ('hyperscaler_capex', 'datacenter_capex');
UPDATE industry_driver
  SET blocker = 'needs-coverage',
      source_name = 'Customer capex — the real customers of advanced foundry are the hyperscalers and fabless designers Atlas does not fully cover; fabless capex is NOT a substitute for it'
  WHERE key = 'customer_capex';

-- ── Unavailable: disclosed in commentary, not in structured filings ────────
UPDATE industry_driver
  SET blocker = 'unavailable',
      source_name = 'Earnings commentary only — not an XBRL fact, so no extraction produces it'
  WHERE key IN ('utilisation', 'bit_shipment_growth', 'hbm_supply', 'gpu_shipments');
