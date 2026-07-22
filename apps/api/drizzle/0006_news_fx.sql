-- News monitoring + FX rates from free public sources.
--
-- news_item: the News Research Analyst's output. Tagging is the deliverable —
-- an untagged headline cannot be traversed to from a company or an industry,
-- so the tag arrays are the reason this table exists, not decoration.
--
-- A headline is a MONITORING signal, never a source of record for a number:
-- nothing in the financial engine may read from here.

CREATE TABLE IF NOT EXISTS news_item (
  id            text PRIMARY KEY,
  title         text NOT NULL,
  link          text NOT NULL UNIQUE,
  publisher     text,
  published_at  timestamptz,
  query         text,
  -- Comma-separated ids; small enough that a join table would cost more than
  -- it returns at this scale.
  company_ids   text,
  industry_ids  text,
  fetched_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS news_item_published_idx ON news_item (published_at DESC);

-- Central-bank FX. The trade book anchors on the BNM MIDDLE rate; the dealer
-- spread is booked separately as an fx_spread fee, so currency performance and
-- conversion cost stay separable (PORTFOLIO-ACCOUNTING §5).
ALTER TABLE pms_fx_rate ADD COLUMN IF NOT EXISTS half_spread_pct double precision;
ALTER TABLE pms_fx_rate ADD COLUMN IF NOT EXISTS provider text;
