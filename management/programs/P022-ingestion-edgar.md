# P022 (spike) — SEC EDGAR Ingestion for US-listed Coverage

**Status:** v1 delivered with this PR · **Owner:** Claude Code · **Date:** 2026-07-21

## Mission

Replace manual seeding with automated, provenance-perfect ingestion. SEC
EDGAR's `companyfacts` API serves every XBRL fact a company ever filed —
free, no auth, machine-readable. Atlas concepts were designed XBRL-shaped
(`apps/api/src/domain/concepts.ts`), so this is a mapping exercise, not a
re-architecture.

## v1 scope (this PR)

- **Companies:** the 7 US-GAAP filers in coverage — NVDA, AMD, AVGO, MU,
  INTC, ANET, VRT. (ASML/TSMC file IFRS-taxonomy 20-Fs — follow-up; SK hynix
  and Bursa names are not on EDGAR.)
- **Periods:** ANNUAL fiscal years, full history available in companyfacts
  (typically 2008+ → deep annual results tables like the glove names have).
- **Pipeline** (mirrors the glove import pattern):
  1. `seed/edgar/refresh.mjs` — network step, run locally: fetches
     `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` per
     company (SEC-required User-Agent, throttled), maps tags → concepts,
     writes compact `facts.json` (checked in, with retrievedAt provenance).
  2. `seed/edgar/generate.mjs` — deterministic, offline: `facts.json` →
     `edgar-seed.sql`. CI regenerates this only (no network in CI).
- **Upsert semantics:** SQL `ON CONFLICT` upserts keyed on the natural keys
  (`financial_period(company_id, period_label)`,
  `financial_fact(period_id, concept)`) — never `INSERT OR REPLACE`, so
  existing periods keep their ids and facts EDGAR doesn't map survive.
  Where EDGAR does map a fact, its value and source win (provenance upgrades
  from `seed` to `sec-edgar`).

## Fiscal-year labeling

EDGAR entry `fy`/`fp` describe the *filing*, not the datapoint, so data
years are derived from the datapoint's `end` date against each company's
fiscal-year-end month (NVDA Jan, AVGO Nov, MU Aug/Sep, others Dec), with a
±1-month window and a 330–380-day duration filter for flow concepts
(accepts 52/53-week years, rejects quarters and YTD spans). Latest `filed`
wins per (concept, year) — restatements and comparatives resolve correctly.
Labels follow the existing convention (`FY24`), so EDGAR rows land on the
same periods the manual seed created.

## Tag map (US-GAAP → Atlas concepts)

Revenue ← RevenueFromContractWithCustomerExcludingAssessedTax | Revenues |
SalesRevenueNet · CostOfRevenue ← CostOfRevenue | CostOfGoodsAndServicesSold ·
RnDExpense ← ResearchAndDevelopmentExpense · SnMExpense ←
SellingAndMarketingExpense · GnAExpense ← GeneralAndAdministrativeExpense,
falling back to combined SellingGeneralAndAdministrativeExpense (documented
caveat: combined SG&A renders on the G&A row) · OperatingIncome ←
OperatingIncomeLoss · NetIncome ← NetIncomeLoss · IncomeTax ←
IncomeTaxExpenseBenefit · InterestExpense ← InterestExpense |
InterestExpenseNonoperating · OperatingCashFlow ←
NetCashProvidedByUsedInOperatingActivities · Capex ←
PaymentsToAcquirePropertyPlantAndEquipment · DepreciationAmortization ←
DepreciationDepletionAndAmortization | DepreciationAmortizationAndAccretionNet
· ShareRepurchases ← PaymentsForRepurchaseOfCommonStock ·
AcquisitionsInvestments ← PaymentsToAcquireBusinessesNetOfCashAcquired ·
CashAndEquivalents ← CashAndCashEquivalentsAtCarryingValue (+
ShortTermInvestments | MarketableSecuritiesCurrent when present) ·
AccountsReceivable ← AccountsReceivableNetCurrent · Inventory ← InventoryNet
· PropertyEquipment ← PropertyPlantAndEquipmentNet · GoodwillIntangibles ←
Goodwill + IntangibleAssetsNetExcludingGoodwill · CurrentAssets ←
AssetsCurrent · CurrentLiabilities ← LiabilitiesCurrent · TotalAssets ←
Assets · TotalLiabilities ← Liabilities · TotalEquity ← StockholdersEquity ·
LongTermDebt ← LongTermDebtNoncurrent | LongTermDebt · ShortTermDebt ←
LongTermDebtCurrent · AccountsPayable ← AccountsPayableCurrent ·
DilutedShares ← WeightedAverageNumberOfDilutedSharesOutstanding

Values are converted to millions. Expense/outflow magnitudes stored positive
(sign is presentation, per the facts convention).

## Known caveats (documented, not hidden)

- Diluted share counts for years older than the newest 10-K's comparatives
  are as-reported (pre-split) — EPS is only split-consistent for recent
  years. Fix lands with a split-adjustment table (follow-up).
- Combined SG&A filers render the total on the G&A row.
- Quarterly ingestion needs YTD-differencing for cash-flow tags — deferred
  to P022 v2, spec'd in this doc's follow-ups.

## Follow-ups

1. Quarterly ingestion (YTD diff) for US names.
2. IFRS mapping for ASML (20-F) and TSMC (20-F).
3. Move `refresh.mjs` into a Workers Cron (P022 proper) writing straight to
   D1 with the same natural-key upserts.
4. Split-adjustment table for historical per-share data.
