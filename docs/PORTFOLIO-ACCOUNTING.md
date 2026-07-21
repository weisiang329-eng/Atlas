# Atlas — Portfolio Accounting & Trade Book

The book-of-record for the owner's own trading: every fill, every lot, every
cost, every ringgit of P&L. This document is the model; `apps/api/src/domain/`
implements it. **The two must always agree** — change one, change the other in
the same PR.

Companion: `docs/INVESTMENT-METHODOLOGY.md` (how Atlas judges *companies*).
This file is about how Atlas accounts for *the owner's positions*.

---

## 1. What this is, and why it is not a Moomoo mirror

Institutional desks separate three systems: an **OMS** (orders), an **EMS**
(execution), and a **PMS** (positions, cost, P&L, reporting). Atlas builds the
**PMS** — the accounting book. The broker executes; Atlas keeps the book.

This distinction is forced by reality, not preference. The Moomoo/Futu OpenAPI
was surveyed before design (v10.8 docs, July 2026):

| What we need | What the API gives | Consequence |
| --- | --- | --- |
| Fills | `history_deal_list_query()` → `order_id`, `deal_id`, `code`, `qty`, `price`, `trd_side`, `create_time`, `deal_market` | Usable as the trade feed |
| **Fees** | **No fee or commission field at all** | Atlas must compute fees from a schedule (§6) |
| **Currency** | **No currency field on a deal** | Derived from market (§5) |
| **Per-lot cost** | Positions are **aggregate per symbol** only (`qty`, `cost_price`, `average_cost`, `unrealized_pl`) | Atlas must do its own lot accounting — the broker cannot answer "what did *this* order earn" |
| History window | Default 90 days, 10 requests / 30s | Atlas must archive continuously, not query on demand |
| Runtime | Requires the OpenD gateway on an always-on host | Cannot run on Cloudflare Workers (see §10) |

**Therefore Atlas is the book of record.** Broker data is an *input* that is
reconciled against, never the source of truth for cost or P&L.

## 2. The core model: positions are derived, lots are real

The mistake most retail trackers make is storing a position (qty + average
price) and mutating it on each trade. That destroys history and makes per-order
P&L impossible.

Atlas stores **immutable events** and derives everything:

```
trade (a fill)  ──buy──>  lot (an open tranche, has its own cost)
                └─sell─>  lot_closure (matches sell qty against one lot)
                                      └─> realized P&L for that pairing

position (总仓)  = Σ open lots for an instrument   ← derived, never stored
```

- **Trade** — one execution. Immutable. Buy or sell.
- **Lot（批次）** — created by every buy. Carries its own cost per share, its
  own fees, its own FX rate, and a `remaining_qty` that only decreases.
- **Lot closure（平仓配对）** — created by every sell, one row per lot consumed.
  This row *is* the per-order profit record the owner asked for.
- **Position（总仓）** — the aggregate view: total qty, total cost, average
  price. Computed from open lots on read.

This gives both requested views for free:

| View | Definition |
| --- | --- |
| **总仓 (Position)** | Σ `remaining_qty` and Σ remaining cost across open lots → average price = total cost ÷ total qty |
| **按订单 (By order)** | Each lot with: bought qty, sold qty, remaining qty, and the realized P&L of every closure against it |

Worked example — the owner's own case (buy 50, sell 20, 30 remain):

```
Buy  50 @ 10.00  →  lot#1: qty 50, cost 10.00, remaining 50
Sell 20 @ 12.00  →  closure: lot#1 × 20, proceeds 240, cost 200, realized +40
                    lot#1 remaining → 30
Position now: 30 shares, cost 300, average 10.00, unrealized = 30 × (mkt − 10)
```

## 3. Matching rule — FIFO

**FIFO (先进先出)** is the default and current setting: a sell consumes the
oldest open lots first. Chosen because it is the industry default and matches
what Moomoo (and nearly every broker) reports, so Atlas reconciles cleanly
against broker statements.

The matcher is a pure function over `(open lots, sell qty)` → closures, so
LIFO / HIFO / specific-lot are a strategy swap, not a rewrite. Specific-lot
(the institutional escape hatch, where the trader names the lot to close) is
the intended v2 addition.

**A closure is never recomputed.** Once a sell is matched, the pairing and its
realized P&L are fixed history. Re-running the matcher on existing trades must
be idempotent.

## 4. P&L — realized, unrealized, and the FX split

### Realized (per closure)

```
proceeds_local = qty × sell_price          (trade currency)
cost_local     = qty × lot.cost_price      (trade currency)
fees           = sell fees allocated to this closure + buy fees allocated pro-rata
gross_pl_local = proceeds_local − cost_local
net_pl_local   = gross_pl_local − fees          ← "扣了水钱之后"
```

### The FX decomposition (multi-currency)

Base currency is **MYR**. A US trade earns (or loses) in two ways at once, and
mixing them hides which. With `P₀,R₀` at buy and `P₁,R₁` at sell:

```
total_pl_base = qty × P₁ × R₁ − qty × P₀ × R₀
price_pl_base = qty × (P₁ − P₀) × R₀      ← the stock moved
fx_pl_base    = qty × P₁ × (R₁ − R₀)      ← the ringgit moved
```

These are exact — `price_pl_base + fx_pl_base = total_pl_base` algebraically,
and `db:test` asserts it. Every realized row stores all three, so the owner can
always answer "did I make money on the stock or on the currency?"

### Unrealized (per open lot)

Same decomposition, with the current market price and current FX rate in place
of the sell values. Unrealized P&L requires live prices — **blocked on P027**
(market-data key). Until then, unrealized renders `—`, never a guess, per the
platform's first rule.

## 5. Currency and markets

Every instrument has a trading currency, derived from its market:

| Market | Currency |
| --- | --- |
| US (NASDAQ / NYSE) | USD |
| Bursa Malaysia | MYR |
| HK (HKEX) | HKD |
| SG (SGX) | SGD |

Each trade stores its **own** FX rate to base at trade date (`fx_rate`), so
historical P&L never shifts when today's rate moves. Rates are a sourced fact
like any other, in `fx_rate(date, from, to, rate, source)`.

**Which rate — the anchor (decided 2026-07-21).** Bookkeeping uses the **Bank
Negara Malaysia (BNM) mid-rate** for the trade date: objective, auditable,
published, and free. The broker's actual dealing rate is worse than mid by a
spread, and that difference is **not** hidden inside the FX P&L — it is booked
separately as an `fx_spread` fee on the conversion.

This is the institutional treatment and it keeps two different questions apart:

- *"Did the ringgit move for me or against me?"* → the FX P&L component, at an
  objective reference rate.
- *"What did the broker charge me to convert?"* → an explicit `fx_spread` cost,
  which can then be totalled per month like any other fee.

Booking conversions at the dealing rate instead would silently fold the
broker's margin into currency performance, and the owner would never see how
much conversion actually costs.

## 6. Fees — the fee schedule

The broker API returns no fees, so Atlas models them per market and lets the
owner override any trade with the actual charged amount. Computed fees are
marked `estimated`; overridden ones `actual`. Reconciliation reports the drift.

Fee kinds carried per trade (each a row, so nothing is lumped into an opaque
total): `commission`, `platform`, `stamp_duty`, `clearing`, `settlement`,
`exchange`, `regulatory` (SEC/TAF), `fx_spread`, `other`.

Market rules as implemented (all rates configurable — a fee change is a config
edit, not a code change):

- **US** — commission + platform fee per share with a minimum; on **sells
  only**: SEC fee and FINRA TAF (regulatory); settlement fee per share.
- **Bursa Malaysia** — brokerage with a minimum; clearing fee 0.03% capped;
  stamp duty RM1.50 per RM1,000 of contract value, capped per contract.
- **HK** — commission + platform; stamp duty 0.1% (rounded up); trading fee,
  SFC transaction levy, CCASS settlement fee.
- **SG** — commission + platform + clearing + SGX access fee.

> Rates drift with broker promotions and regulation. The schedule is
> data, versioned by effective date, so historical trades keep the fees that
> applied when they happened.

## 7. Cash and the fund view

Trading P&L alone does not answer "how am I doing". Atlas also records
**cash movements**: `deposit`, `withdrawal`, `dividend`, `interest`,
`fee`, `fx_conversion`, `tax`. With trades plus cash, the three statements the
owner asked for become computable:

- **P&L** — realized trading P&L + dividends + interest − fees, by period and
  by instrument. (The "总盈利 / 每笔 Order 盈利 / 扣水钱后实际盈亏" view.)
- **Balance sheet** — assets (cash by currency + positions at cost, at market
  once P027 lands) vs contributed capital + retained P&L.
- **Cash flow** — deposits and withdrawals (financing), buys and sells
  (investing), dividends/interest/fees (operating).

Fee totals per period ("一个月给了多少水钱") fall out of the fee rows directly.

## 8. Reconciliation

Because Atlas keeps its own book, it must prove the book matches the broker:

1. Position qty per symbol: Atlas Σ open lots vs broker `qty`
2. Average cost: Atlas vs broker `average_cost` (expected to differ slightly —
   broker uses diluted cost; the report explains the difference rather than
   hiding it)
3. Cash balance per currency
4. Fee drift: estimated vs actual

Breaks are surfaced, never auto-corrected. An unexplained break is a data
problem to investigate, not a number to overwrite.

## 9. Invariants (asserted in `db:test`)

1. `Σ closures.qty` for a lot ≤ that lot's original qty, and
   `remaining_qty = original_qty − Σ closed`
2. A sell never closes more than the position holds (no accidental shorts;
   genuine shorts are an explicit future feature, not an overflow)
3. `price_pl_base + fx_pl_base = total_pl_base` for every closure
4. Position average price = Σ open lot cost ÷ Σ open lot qty
5. Re-running the matcher over the same trades produces identical closures
6. Every monetary value carries a currency; no bare numbers

## 10. Moomoo integration (designed, blocked)

Blocked on an **always-on host** for the OpenD gateway — Cloudflare Workers
cannot run it (the same blocker as P028 trading). Design:

```
OpenD host ──daily──> sync job ──> POST /v1/pms/import (idempotent on deal_id)
                                     └─> creates trades, computes fees,
                                         runs the FIFO matcher, then reconciles
```

- Idempotency key is Moomoo's `deal_id`; re-importing a day is a no-op.
- Import is **append-only**: it never edits an existing trade. A correction is a
  new adjusting entry, so the book keeps its audit trail.
- The 90-day window means the sync must run at least quarterly to lose nothing;
  daily is the design target.
- Manual entry remains first-class forever — the owner's book must work with no
  broker connection at all.
