# ADR — Data sourcing: cost must not scale with coverage

**Decided 2026-07-23. Status: accepted.**

## The question

Atlas covers 10 industries today. The roadmap goes wider — ERP, more sectors,
eventually anything the owner wants to decide about. Every industry has a
research vendor selling its numbers: TrendForce for memory, SEMI for
equipment, Drewry for shipping, IATA for aviation, Wood Mackenzie for energy,
Nielsen for consumer.

If each new industry needs its own subscription, the platform's running cost
grows **linearly with coverage** while the value of one more industry is at
best flat. At ten industries that is uncomfortable. At a hundred it is
impossible — and it would be the single largest line item in a system whose
entire infrastructure otherwise costs a few dollars a month.

That is not a budgeting detail. It decides what Atlas can ever cover.

## The decision

**Sources must be free at the margin: adding an industry must add no
recurring cost.** In descending order of preference:

| Tier | What | Why it scales |
| --- | --- | --- |
| **1. The companies' own filings** | SEC EDGAR, Bursa, TWSE, DART | **Every public company on earth files, quarterly, for free.** A new industry brings its own primary source with it. This is the tier that makes 100 industries possible. |
| **2. Government & central-bank statistics** | FRED, EIA, US Census, World Bank, BNM | **One free key covers every industry.** FRED alone carries commodity prices, PPI by NAICS, inventories and macro series — the marginal cost of the eleventh industry is zero. |
| **3. Exchange open data** | TWSE monthly revenue, filings atoms | Free, no key, and monthly rather than quarterly — the highest frequency available without paying. |
| **4. Derived from tiers 1–3** | Inventory days, capex, spreads, ratios | Costs nothing but code, and code is a one-time cost that gets reused. |
| **✗ Banned: per-industry commercial research** | TrendForce, DRAMeXchange, SEMI, Drewry, IATA, Bloomberg | Cost scales with coverage. This is the tier that ends the project. |

**A source that must be bought per industry is not adopted, no matter how good
it is.** If the only way to model something is a subscription, the honest
answer is that Atlas does not model it, and the driver says so
(`blocker: paid` with the substitute named).

## Why this is not merely a budget compromise

The banned tier is mostly selling the **lagging** half of every model.

`docs/INDUSTRY-INTELLIGENCE.md` §3 states the rule for memory and it
generalises: *"price is lagging confirmation; inventory is the leading
signal. By the time DRAM contract prices rise, memory equities have typically
already run for 6–9 months."* What TrendForce sells is the price. What leads
it — inventory, capex, utilisation — is in the filings, free, for every
company in every industry.

The same shape holds elsewhere. Shipping rate indices lag vessel orderbooks
and port congestion; aviation yield data lags capacity announcements. **The
expensive number is usually the confirmation, and the free number is usually
the signal.**

There is a second-order benefit: a model built on filings is auditable by
anyone with a browser. A model built on a licensed feed cannot even show its
inputs.

## What this costs us, honestly

This is not free of consequence, and the losses should be stated:

- **No true channel inventory.** Maker inventory days (computable) sits one
  step upstream of distributor stock (not computable) — later than the
  channel, earlier than margin, and contaminated by strategic builds.
- **No contract or spot prices** for memory. Sector-wide PPI and Census
  inventories are coarser substitutes measuring something adjacent.
- **No surveyed bookings.** Book-to-bill is inferred from capex, not observed.
- **Some drivers are simply unavailable at any price** — CoWoS packaging
  capacity, HBM stacking yield. Those stay in the model as
  `blocker: unavailable`, because a model that states its own blind spots is
  more useful than one that looks complete.

The trade is deliberate: **coverage breadth over measurement precision.**
Atlas is a decision-support tool for one person, not a sell-side research
desk. Knowing roughly what moves twenty industries beats knowing exactly what
moves one.

## Consequences for the code

1. `src/ingest/sources.ts` carries `status: "paid"` with `costNote`,
   `substitutedBy` and `rejectedReason` — a rejection is recorded, not
   forgotten, so nobody reopens it as an unknown every six months.
2. Every driver carries a `blocker`, and `GET /v1/pending` groups by it. If
   the `paid` group ever grows, that is the signal this ADR is being eroded.
3. A substitute is **never relabelled as the thing it replaces.** Maker
   inventory days ships as `inventory_days` and describes itself as the
   maker's own stock. Renaming it "channel inventory" to fill the slot would
   be a fabricated measurement, which convention #1 forbids.
4. New industries are onboarded from tier 1 first: file the companies, ingest
   their filings, derive what the drivers need. Only then look outward.

## Revisit if

- A single subscription would cover **many** industries at a cost that does
  not grow with coverage (an aggregator, not a vertical vendor), **and** it
  buys leading rather than lagging data.
- Atlas stops being a private tool and the economics change.

Until then: **filings scale, subscriptions do not.**
