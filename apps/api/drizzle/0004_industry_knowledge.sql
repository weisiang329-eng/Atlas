-- Industry Research Foundation (Atlas OS V1 Book 2).
--
-- Two ideas from that manual drive this schema:
--
-- 1. A MANDATORY 20-SECTION SCHEMA. Every industry is expected to carry the
--    same sections, so "what do we not know about this industry" is a
--    computable question rather than a judgement. Completeness > 95% is a
--    stated KPI in the manual; it can only be measured against a fixed list.
--
-- 2. EVERY RECORD CARRIES ITS PROVENANCE. Source, timestamp and confidence are
--    columns, not optional metadata — and conflicting values are STORED with
--    attribution rather than silently resolved, because the disagreement is
--    itself information.

CREATE TABLE IF NOT EXISTS industry_knowledge (
  id           serial PRIMARY KEY,
  industry_id  text NOT NULL REFERENCES industry(id) ON DELETE CASCADE,
  -- One of the 20 mandated sections (see MANDATORY_SECTIONS in domain/industry-knowledge.ts).
  section      text NOT NULL,
  content      text NOT NULL,
  -- 'fact' or 'assumption' — the manual requires these be separable.
  kind         text NOT NULL DEFAULT 'fact',
  source_id    text REFERENCES source(id),
  source_url   text,
  -- 0..1. A low-confidence record is still knowledge; a hidden one is not.
  confidence   double precision NOT NULL DEFAULT 1,
  as_of        date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT industry_knowledge_kind_chk CHECK (kind IN ('fact','assumption'))
);
CREATE INDEX IF NOT EXISTS industry_knowledge_idx
  ON industry_knowledge (industry_id, section);

-- Industry KPIs. The manual is explicit: NEVER use a generic financial metric
-- as a primary industry KPI — find the operational driver unique to the
-- industry. Each of these fields is mandated by the KPI Discovery Rules.
CREATE TABLE IF NOT EXISTS industry_kpi (
  id                serial PRIMARY KEY,
  industry_id       text NOT NULL REFERENCES industry(id) ON DELETE CASCADE,
  key               text NOT NULL,
  name              text NOT NULL,
  definition        text NOT NULL,
  why_it_matters    text NOT NULL,
  unit              text,
  -- 'leading' or 'lagging' — whether it moves before or after the outcome.
  signal_type       text NOT NULL DEFAULT 'lagging',
  update_frequency  text,
  source_name       text,
  source_url        text,
  -- Company ids and product names this KPI moves, for graph traversal.
  affected_companies text,
  affected_products  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT industry_kpi_signal_chk CHECK (signal_type IN ('leading','lagging')),
  CONSTRAINT industry_kpi_unq UNIQUE (industry_id, key)
);
