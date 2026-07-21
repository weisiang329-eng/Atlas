# Atlas — Investment Methodology

**The theoretical model behind every number Atlas produces.** This is the core
intellectual asset of the platform: the engineering can be rebuilt in weeks,
the model is what makes the output worth trusting.

Implemented in `apps/api/src/domain/` — `ratios.ts` (measurement),
`scoring.ts` (Atlas Score), `industry.ts` (cycle signal), `graph.ts` +
`valuechain.ts` (structure). **This document and that code must always agree.**
If you change a weight, a threshold, or a definition, change this file in the
same PR.

> **Not investment advice.** Atlas is a research instrument. It describes what
> reported financials say about a business. It does not tell anyone to buy or
> sell anything.

---

## 1. First principles

Five commitments that constrain everything else. They are the reason to trust
the output, and they are non-negotiable.

**1. Every number traces to a filing.** Each fact carries a `source` row
(`seed` / `sec-edgar` / `glove-tracker` / `manual`). Nothing is estimated,
smoothed, or back-filled. Provenance is a first-class column, not metadata.

**2. Missing data stays missing.** A gap renders `—`. Atlas never imputes,
never interpolates, never substitutes a peer median. A score computed from
three of four factors says so; it does not pretend to be a four-factor score.

**3. Transparent over clever.** Every score decomposes to the metrics and
thresholds that produced it, all the way down to the filed figure. A user must
be able to reconstruct any output by hand. This rules out black-box ML ranking
even where it might score better — an unexplainable number is unusable in a
decision you must defend.

**4. Reproducible and stable.** Same inputs → same output, forever. v1
deliberately uses **absolute thresholds, not cross-sectional percentiles**, so
a company's score does not silently change because an unrelated company was
added to coverage. Comparability across time beats optimal spread within a
snapshot.

**5. Description, not prediction.** Atlas measures the business as reported.
It does not forecast earnings, target prices, or returns. Where the platform
does infer (the industry cycle signal), the inference is labelled as such and
its trigger conditions are published.

## 2. The data model in one line

**Facts, not statements.** The atom is `(company, period, concept, value,
source)`. Income statements, ratios, and scores are *derived views* computed
server-side on read. Consequences: a filing correction updates one fact and
propagates everywhere; two data sources can cover the same company without
conflict (natural-key upsert); and the platform can answer "where did this
come from" for any figure on any screen.

Facts are stored as **magnitudes**; presentation applies the sign. A loss is
`NetIncome` with a negative-rendering presenter, not a negative fact — which
keeps aggregation and comparison unambiguous.

## 3. Measurement layer — `ratios.ts`

Every derived metric, defined exactly as implemented:

| Metric | Definition |
| --- | --- |
| Operating margin | OperatingIncome / Revenue |
| Net margin | NetIncome / Revenue |
| Revenue growth (YoY) | (Revenue − Revenue₋₁) / Revenue₋₁ |
| Free cash flow | OperatingCashFlow − Capex |
| FCF margin | FCF / Revenue |
| Return on equity | NetIncome / TotalEquity |
| Current ratio | CurrentAssets / CurrentLiabilities |
| Quick ratio | (CurrentAssets − Inventory) / CurrentLiabilities |
| Debt / equity | TotalDebt / TotalEquity |
| Net debt / EBITDA | (TotalDebt − Cash) / EBITDA |
| Interest coverage | OperatingIncome / InterestExpense |
| Cash conversion | OperatingCashFlow / NetIncome |
| Asset turnover | Revenue / TotalAssets |
| Inventory turnover | CostOfRevenue / Inventory |

Any ratio whose inputs are absent is `undefined` and disappears from the UI as
`—`. Ratios are computed per period from that period's facts; growth uses the
immediately preceding period in the same series.

## 4. The Atlas Score — `scoring.ts`

### 4.1 What it is

A **0–100 quality score of a company's reported financial profile**, from
annual fundamentals only. **No price, no valuation, no forecast.** It answers
"how good is this business, financially, as filed" — not "is it a good
investment at today's price."

### 4.2 Why these four factors

The factor set follows the empirical quality literature — profitability and
balance-sheet robustness are the dimensions with the most durable evidence of
persistence (gross-profitability and quality-minus-junk work, Piotroski's
F-Score) — narrowed to what can be computed from filings alone with full
transparency.

| Factor | Weight | Reads | Why it earns its weight |
| --- | --- | --- | --- |
| **Profitability** | 30% | Net margin, operating margin, ROE | The most persistent and most economically meaningful attribute; margin structure is the clearest evidence of competitive position |
| **Growth** | 25% | Revenue growth YoY, revenue CAGR | Direction of the business; deliberately revenue-based (earnings growth off a small or negative base is noise) |
| **Financial strength** | 25% | Debt/equity, current ratio, interest coverage | Survivability. Weighted equal to growth on purpose: in cyclical industries, balance sheets decide who is still there at the bottom |
| **Cash quality** | 20% | FCF margin, cash conversion | The honesty check. Earnings that do not convert to cash are the most common early warning of accounting or working-capital trouble |

Weights are **judgment, not optimisation** — they were not fitted to
historical returns (see §7 Limitations). They encode a stated view: quality
first, growth and survivability equal, cash as the integrity check.

### 4.3 How a score is computed

1. **Normalise each metric** to 0–100 with a piecewise-linear map between a
   documented floor and ceiling, clamped at both ends:

   | Metric | 0 at | 100 at |
   | --- | --- | --- |
   | Net margin | 0% | 30% |
   | Operating margin | 0% | 35% |
   | Return on equity | 0% | 25% |
   | Revenue growth (YoY) | 0% | 40% |
   | Revenue CAGR | 0% | 30% |
   | Debt / equity | 1.5x | 0x *(inverted)* |
   | Current ratio | 1.0x | 3.0x |
   | Interest coverage | 2x | 20x |
   | FCF margin | 0% | 25% |
   | Cash conversion | 60% | 110% |

2. **Factor score** = simple average of its *available* metric scores.
3. **Composite** = weighted average of the factors that have a score, with
   weights **renormalised over what is present**.
4. **Grade**: A ≥ 80, B ≥ 65, C ≥ 50, D ≥ 35, E below.

Clamping is intentional: a 60% net margin is excellent, but not twice as
excellent as 30%. Linear-then-clamp keeps the score interpretable and stops
one extraordinary metric from dominating the composite.

### 4.4 The renormalisation rule — and its honest cost

If a company has no balance-sheet data, Financial Strength is `null` and the
composite is computed over the remaining 75% of weight, rescaled. This is the
correct choice under principle #2 (never impute), but it has a real
consequence: **a company with sparse data is scored only on what it discloses,
which can flatter it.** SK hynix and the Malaysian glove names are currently
income-statement-only, so their scores omit leverage and liquidity entirely.

The UI must always show which factors are `—`. A score is never presented
without its factor breakdown.

## 5. Industry layer — cycle signal (`industry.ts`)

Company quality is not enough in a cyclical sector: a glove maker at a
cycle peak and the same maker at a trough look like different businesses on
identical management.

Atlas therefore tracks **industry-level drivers** (glove ASP, nitrile-butadiene
raw-material cost) as time series, and derives a **margin cycle signal** from
the spread between selling price and input cost. It is an *inference*, labelled
as such, published with its trigger conditions, and never mixed into the Atlas
Score — a company's quality score stays a statement about the company.

Reading the two together is the intended workflow: *quality tells you which
company, cycle tells you when.*

## 6. Structure layer — knowledge graph & value chain

Companies are not independent observations. Atlas encodes supply and
competition edges (`supplies`, `competes_with`) and stage ordering along the
AI-hardware value chain.

Analytically this supports: exposure tracing (a customer's capex shock reaching
a supplier), concentration risk (revenue depending on few counterparties), and
comparability (peers = same value-chain stage, not merely same sector label).

Edges are **sourced assertions**, not inferences — an edge exists because a
filing or a documented source says so.

## 7. Known limitations — read before trusting any output

Stated plainly, because a model whose weaknesses are hidden is a liability.

1. **No valuation.** The score is quality-only. A 90-scoring company can be a
   poor investment at the wrong price. Valuation multiples require price data
   (blocked on a market-data key, P027) and are the single biggest gap.
2. **Weights and thresholds are judgment, not fitted.** No backtest has been
   run. They are defensible priors calibrated against large-cap semiconductor
   and hardware norms — not evidence of return predictability.
3. **Threshold bias across industries.** A 30%-net-margin ceiling suits
   semiconductors; commodity glove manufacturing rarely approaches it, so
   glove names compress into low scores. Cross-industry score comparison is
   **not** supported today. Compare within a sector.
4. **Cyclical timing distortion.** Absolute thresholds on a single latest year
   mean a cyclical peak scores as quality. The cycle signal is the mitigation,
   but it is a separate reading the user must perform.
5. **Sparse-data flattery.** See §4.4 — omitted factors are omitted, not
   penalised.
6. **Annual-only for most names.** Quarterly depth currently exists for the
   glove sector; US names are annual (quarterly EDGAR ingestion is P022 v2).
7. **Survivorship and coverage bias.** 17 companies chosen by the owner's
   interest, not a defined universe. Rankings are relative to that set.
8. **No qualitative dimension.** Management quality, technology moat,
   regulation and geopolitics are absent from the score by construction.

## 8. Roadmap of the model itself

| Version | Change | Unblocked by |
| --- | --- | --- |
| **v1 (live)** | Absolute-threshold 4-factor quality score | — |
| **v2** | Cross-sectional **percentile** factor scores within value-chain stage (fixes §7.3); persist `score_history` so scores are versioned and auditable over time | nothing — buildable now |
| **v2** | **Valuation factor** — P/E, EV/EBITDA, FCF yield, and a quality-vs-price view (the "is it cheap for a reason" question) | market-data key (P027) |
| **v3** | **Sector-calibrated thresholds** — per-value-chain-stage floors/ceilings replacing one global set | v2 percentiles |
| **v3** | **Backtest harness** — score-vs-forward-return study to convert §7.2 from judgment into evidence, published with results whatever they show | price history (P027) |
| **v3** | **Decision-outcome tracking** (P023) — log a thesis, revisit it, measure the analyst, not just the company | — |

## 9. Changing the model — the rule

The Atlas Score is a published measure. Changing it silently invalidates every
past reading.

1. Change the code **and this document** in the same PR.
2. State the reasoning in the PR — what was wrong, why the new form is better.
3. Note the effect on existing scores (which companies move, and why).
4. Once `score_history` lands (v2), a model change bumps a **model version**
   stamped onto every stored score, so old readings stay interpretable.

Never tune a threshold to make a particular company rank where someone wants
it to. That is the one change that destroys the asset.
