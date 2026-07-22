-- 0010 — record each company's fiscal year end, so quarters can be compared.
--
-- Why this is needed at all: the EDGAR seed writes 402 quarterly periods with
-- fiscal_year and fiscal_quarter but NO report_date — the column is not in the
-- INSERT, in the seed or in the ingest route. Every US industry's quarterly
-- history was therefore silently empty, and the driver backtest reported
-- "insufficient data" for a reason that had nothing to do with the data.
--
-- With the fiscal year end recorded, (fy, q) maps to a calendar quarter by
-- arithmetic: fiscal quarters end three months apart from the fiscal year end.
-- That is derivation, not invention — and no fabricated date is written into
-- report_date, which means "when this was filed".
--
-- Values are the fiscal-year-end MONTH, from each company's own filings; they
-- already existed in src/ingest/edgar-tags.ts as the roster the ingestion
-- keys on, so this migration moves a known fact into the database rather than
-- introducing a new claim. Companies whose fiscal calendar Atlas has not
-- confirmed are left NULL: their periods stay unplaced rather than guessed.

ALTER TABLE company ADD COLUMN IF NOT EXISTS fiscal_year_end_month integer;

UPDATE company SET fiscal_year_end_month = 1 WHERE id = 'nvidia';    -- ends late January
UPDATE company SET fiscal_year_end_month = 12 WHERE id = 'amd';
UPDATE company SET fiscal_year_end_month = 11 WHERE id = 'broadcom';  -- ends early November
UPDATE company SET fiscal_year_end_month = 9 WHERE id = 'micron';     -- ends late August/September
UPDATE company SET fiscal_year_end_month = 12 WHERE id = 'intel';
UPDATE company SET fiscal_year_end_month = 12 WHERE id = 'arista';
UPDATE company SET fiscal_year_end_month = 12 WHERE id = 'vertiv';

-- The glove makers file to Bursa and their periods already carry report_date,
-- so they need no derivation. Only the two Atlas can actually source are set:
-- both fiscal year ends are stated in the companies' own seed descriptions.
UPDATE company SET fiscal_year_end_month = 8 WHERE id = 'top-glove';   -- "Fiscal year ends August"
UPDATE company SET fiscal_year_end_month = 3 WHERE id = 'hartalega';   -- "Fiscal year ends March"

-- Deliberately NOT set: tsmc, asml, sk-hynix, kossan, supermax, careplus,
-- comfort-gloves, hextar-healthcare. Nothing Atlas has ingested states their
-- fiscal calendar, and a plausible guess would silently misplace every one of
-- their quarters by up to three months — a wrong series that still looks like
-- a number is worse than an absent one. Their filed report_date already
-- places them; this column is only the fallback.
