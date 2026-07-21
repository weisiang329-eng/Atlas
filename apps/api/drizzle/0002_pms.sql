-- Portfolio accounting / trade book (PMS).
-- Model: docs/PORTFOLIO-ACCOUNTING.md — trades are immutable events, lots carry
-- cost, closures record per-order realized P&L, positions are derived on read.

-- A brokerage account. Base currency is the reporting currency for this book.
CREATE TABLE IF NOT EXISTS pms_account (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  broker        text NOT NULL,                     -- 'moomoo' | 'manual' | …
  account_type  text NOT NULL DEFAULT 'cash',      -- 'cash' | 'margin'
  base_currency text NOT NULL DEFAULT 'MYR',
  external_id   text,                              -- broker account id
  created_at    text NOT NULL DEFAULT (now())::text
);

-- A tradable instrument. `company_id` links to Atlas coverage when the name is
-- one we research; trading names outside coverage are still fully supported.
CREATE TABLE IF NOT EXISTS pms_instrument (
  id         text PRIMARY KEY,
  symbol     text NOT NULL,
  market     text NOT NULL,                        -- 'US' | 'MY' | 'HK' | 'SG'
  currency   text NOT NULL,                        -- trading currency
  name       text NOT NULL,
  company_id text REFERENCES company(id),
  created_at text NOT NULL DEFAULT (now())::text,
  CONSTRAINT pms_instrument_symbol_market_unq UNIQUE (symbol, market)
);

-- FX rates to base. Every trade stores its own rate, so history never shifts.
CREATE TABLE IF NOT EXISTS pms_fx_rate (
  rate_date     date NOT NULL,
  from_currency text NOT NULL,
  to_currency   text NOT NULL,
  rate          double precision NOT NULL,
  source_id     text REFERENCES source(id),
  PRIMARY KEY (rate_date, from_currency, to_currency)
);

-- One execution (fill). Immutable: corrections are new adjusting entries.
CREATE TABLE IF NOT EXISTS pms_trade (
  id             serial PRIMARY KEY,
  account_id     text NOT NULL REFERENCES pms_account(id) ON DELETE CASCADE,
  instrument_id  text NOT NULL REFERENCES pms_instrument(id),
  side           text NOT NULL,                    -- 'buy' | 'sell'
  quantity       double precision NOT NULL CHECK (quantity > 0),
  price          double precision NOT NULL CHECK (price >= 0),
  currency       text NOT NULL,                    -- trade currency
  fx_rate        double precision NOT NULL DEFAULT 1,  -- trade currency -> base
  traded_at      text NOT NULL,                    -- ISO timestamp of the fill
  settled_on     date,
  note           text,
  source_kind    text NOT NULL DEFAULT 'manual',   -- 'manual' | 'moomoo'
  external_order_id text,
  external_deal_id  text,                          -- idempotency key for import
  created_at     text NOT NULL DEFAULT (now())::text,
  CONSTRAINT pms_trade_side_chk CHECK (side IN ('buy','sell')),
  CONSTRAINT pms_trade_deal_unq UNIQUE (account_id, external_deal_id)
);
CREATE INDEX IF NOT EXISTS pms_trade_acct_inst_idx ON pms_trade (account_id, instrument_id, traded_at);

-- Itemised fees. One row per fee kind so nothing hides in an opaque total.
CREATE TABLE IF NOT EXISTS pms_trade_fee (
  id         serial PRIMARY KEY,
  trade_id   integer NOT NULL REFERENCES pms_trade(id) ON DELETE CASCADE,
  kind       text NOT NULL,        -- commission|platform|stamp_duty|clearing|
                                   -- settlement|exchange|regulatory|fx_spread|other
  amount     double precision NOT NULL CHECK (amount >= 0),
  currency   text NOT NULL,
  basis      text NOT NULL DEFAULT 'estimated',   -- 'estimated' | 'actual'
  created_at text NOT NULL DEFAULT (now())::text
);
CREATE INDEX IF NOT EXISTS pms_trade_fee_trade_idx ON pms_trade_fee (trade_id);

-- An open tranche created by a buy. remaining_qty only decreases.
CREATE TABLE IF NOT EXISTS pms_lot (
  id            serial PRIMARY KEY,
  account_id    text NOT NULL REFERENCES pms_account(id) ON DELETE CASCADE,
  instrument_id text NOT NULL REFERENCES pms_instrument(id),
  trade_id      integer NOT NULL REFERENCES pms_trade(id) ON DELETE CASCADE,
  opened_at     text NOT NULL,
  original_qty  double precision NOT NULL CHECK (original_qty > 0),
  remaining_qty double precision NOT NULL CHECK (remaining_qty >= 0),
  cost_price    double precision NOT NULL,          -- per share, trade currency
  fees_total    double precision NOT NULL DEFAULT 0,-- buy-side fees, trade currency
  currency      text NOT NULL,
  fx_rate       double precision NOT NULL DEFAULT 1,
  CONSTRAINT pms_lot_remaining_chk CHECK (remaining_qty <= original_qty),
  CONSTRAINT pms_lot_trade_unq UNIQUE (trade_id)
);
CREATE INDEX IF NOT EXISTS pms_lot_open_idx ON pms_lot (account_id, instrument_id, opened_at);

-- A sell matched against one lot. THIS is the per-order profit record.
CREATE TABLE IF NOT EXISTS pms_lot_closure (
  id             serial PRIMARY KEY,
  lot_id         integer NOT NULL REFERENCES pms_lot(id) ON DELETE CASCADE,
  sell_trade_id  integer NOT NULL REFERENCES pms_trade(id) ON DELETE CASCADE,
  closed_at      text NOT NULL,
  quantity       double precision NOT NULL CHECK (quantity > 0),
  -- trade-currency legs
  cost_price     double precision NOT NULL,
  sell_price     double precision NOT NULL,
  fees_local     double precision NOT NULL DEFAULT 0,  -- buy pro-rata + sell share
  gross_pl_local double precision NOT NULL,
  net_pl_local   double precision NOT NULL,
  currency       text NOT NULL,
  -- base-currency legs, decomposed (see PORTFOLIO-ACCOUNTING §4)
  buy_fx_rate    double precision NOT NULL,
  sell_fx_rate   double precision NOT NULL,
  total_pl_base  double precision NOT NULL,
  price_pl_base  double precision NOT NULL,
  fx_pl_base     double precision NOT NULL,
  net_pl_base    double precision NOT NULL,
  created_at     text NOT NULL DEFAULT (now())::text,
  CONSTRAINT pms_closure_unq UNIQUE (lot_id, sell_trade_id)
);
CREATE INDEX IF NOT EXISTS pms_closure_sell_idx ON pms_lot_closure (sell_trade_id);

-- Cash in and out: what makes the fund view (P&L / balance sheet / cash flow).
CREATE TABLE IF NOT EXISTS pms_cash_movement (
  id            serial PRIMARY KEY,
  account_id    text NOT NULL REFERENCES pms_account(id) ON DELETE CASCADE,
  kind          text NOT NULL,   -- deposit|withdrawal|dividend|interest|fee|
                                 -- fx_conversion|tax|other
  amount        double precision NOT NULL,   -- signed: + in, - out
  currency      text NOT NULL,
  fx_rate       double precision NOT NULL DEFAULT 1,
  occurred_on   date NOT NULL,
  instrument_id text REFERENCES pms_instrument(id),  -- e.g. dividend source
  note          text,
  source_kind   text NOT NULL DEFAULT 'manual',
  external_id   text,
  created_at    text NOT NULL DEFAULT (now())::text
);
CREATE INDEX IF NOT EXISTS pms_cash_acct_idx ON pms_cash_movement (account_id, occurred_on);
