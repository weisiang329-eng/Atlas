# Industry intelligence — taxonomy, drivers, and news tagging

Agreed with the owner 2026-07-22. This is the design of record for the
Industry and Company agents. Nothing here is built yet; it is written down
because the reasoning is the expensive part and it must survive the
conversation it came from.

The one-line goal, in the owner's words:

> 「到底是什么在影响这些行业要点？」

That sentence changes the product from an encyclopedia into a causal model.
An encyclopedia tells you what an industry **is**. A causal model tells you
what **moves** it, by how much, and how early — which is the only version
that helps a decision.

---

## 1. The taxonomy

Five levels. Depth is **deliberately uneven** — a branch stops as soon as it
is driver-homogeneous.

| Level | Name | Example |
| --- | --- | --- |
| L1 | 板块 Sector | 科技 |
| L2 | 产业链 Chain segment | 半导体 · AI 基础设施 |
| L3 | 行业 Industry | 存储 · 代工 · 设备 · 手套 |
| L4 | 细分 Sub-industry | DRAM · NAND · HBM |
| L5 | only where still needed | 丁腈手套 · 天然胶手套 |

### The splitting rule — the only one that matters

> **Two things belong in different leaves if and only if their DRIVERS
> differ.** Same drivers → do not split; another level is another level to
> maintain.

This is why the tree is not GICS. GICS classifies by *what you make*, so it
files NVIDIA, Intel and Micron together under "Semiconductors" — three
companies whose fortunes are moved by CoWoS packaging capacity, process
yield, and inventory weeks respectively. Nothing about that grouping helps.

Worked examples of the rule:

- **HBM splits from DRAM.** Both are "memory", but HBM is a seller's market
  bound to AI capex and CoWoS allocation, while commodity DRAM is a cyclical
  bound to phone and PC demand. Averaged together they produce a curve that
  describes neither.
- **成熟制程 splits from 先进制程.** Advanced foundry follows customer capex;
  mature foundry follows automotive and industrial inventory. The cycles are
  not merely different in amplitude, they are frequently out of phase.
- **Gloves need L5.** 丁腈 (NBR) tracks oil → butadiene; 天然胶 (NR) tracks an
  agricultural crop with its own weather and tapping season. Companies carry
  different product mixes, so the same latex move hurts them by different
  amounts — which is exactly the kind of thing this system exists to know.
- **DRAM does NOT need L5.** DDR4 vs DDR5 share drivers; splitting buys
  nothing.

### "L1..L5" is schema vocabulary and must never reach the screen

The level numbers exist so the code and this document can talk about depth.
They are not labels. A reader should never see `L4 细分` — only:

```
科技  ›  半导体  ›  存储  ›  DRAM
```

The nesting already conveys depth; numbering it just leaks the schema. It
would also actively confuse, because **depth is uneven by design**: gloves go
five levels deep and DRAM stops at four, so a visible "L5" invites the
question "why does this one have an extra level" — whose honest answer is an
implementation detail the reader does not need.

`level` stays in the database column, in code, and in this file. Nowhere else.

### Geography is a TAG, not a level

`科技股` is an industry. `中资股` is a listing venue. A Chinese technology
company belongs to both, so putting them at the same level of one tree is a
contradiction that will not resolve.

Companies carry tags — `#中概` `#港股` `#美国上市` `#马来西亚` — alongside
exactly one position in the industry tree. That position is on a LEAF
(DRAM, 丁腈手套), never on an L3 like 半导体 — classify too coarsely and the
drivers no longer apply to the companies filed under them, which defeats the
whole model. Geography drives FX exposure and
policy risk; it does not drive the industry's economics.

---

## 2. The driver model

A price series on its own is a chart. What makes it useful is the claim
attached to it. Every driver is therefore a complete object:

| Field | Example (NBR latex) |
| --- | --- |
| `industryId` | L4/L5 node — drivers hang off leaves, never off L3 |
| `name` | NBR 丁腈胶乳 |
| `whatItIs` | 手套的主要原料 |
| `phase` | `leading` \| `coincident` \| `lagging` |
| `lagQuarters` | 1 |
| `affects` | COGS |
| `direction` | 胶价 ↑ → 毛利 ↓ |
| `elasticity` | 原料约占成本 50%；胶价 +10% → 毛利率 −3~4pt |
| `whoItHits` | 低端手套厂 > 高端（转嫁能力不同） |
| `sourceId` | MREPC |
| `frequency` | weekly |

**`phase`, `lagQuarters` and `elasticity` are the whole point.** Without them
you are looking at a picture. With them you can do arithmetic, and — more
importantly — you can be **wrong in a checkable way**.

### Frequency follows the source, not a global setting

| Driver | Native frequency |
| --- | --- |
| DRAM spot | daily |
| DRAM contract | monthly (set at month end) |
| NBR / NR latex | weekly |
| Crude, natural gas | daily |
| Inventory weeks | quarterly (from filings) |
| Capex | quarterly |

---

## 3. What each industry watches

Ordered leading → coincident → lagging. The leading row is the one worth
having; the rest is confirmation.

**手套 — a SPREAD model** (feedstock is >50% of cost)
```
利润 = ASP − (丁腈胶/天然胶 + 天然气 + 人工)
领先  产能利用率 · 客户库存 · 丁二烯
同步  丁腈/天然胶价 · 原油 · 天然气 · USD/MYR
滞后  ASP · 毛利率
```

**DRAM / NAND — a CAPACITY-CYCLE model.** Not a spread model: the dominant
cost is depreciation on a multi-billion-dollar fab, so watching input prices
tells you almost nothing.
```
领先  库存周数的拐点 ★ · 三大厂 capex · 现货vs合约价差
同步  合约价 · 位元出货增速
滞后  毛利率 · 财报
```

**HBM — a SUPPLY-BOUND model**
```
领先  CoWoS 封装产能 ★ · GPU 出货
同步  HBM 单价 · 良率
```

**先进制程代工**
```
领先  客户 capex 与订单 · 新厂投产时程
同步  产能利用率 ★ · 先进制程营收占比
```

**成熟制程代工** — 领先看汽车/工业库存, not AI.

**半导体设备 — the earliest signal in the whole chain**
```
领先  订单出货比 (B/B) ★ · 晶圆厂 capex 公告
      设备营收滞后 capex 约 2–3 季
```

**AI 加速器 — supply-constrained**
```
领先  CoWoS 产能 ★ · HBM 供给 · 超大厂 capex 指引
注    需求不是问题，供给才是。盯需求会看错边。
```

**网络 / ASIC** — 数据中心 capex · 端口速率迁移 (400G→800G→1.6T)

**数据中心电力/散热** — 新增装机容量 (MW) ★ · 订单积压/营收比 · 电价 · 铜价

### Three rules that hold across all of them

1. **The further upstream, the more leading.** Equipment → foundry → chip →
   device. Equipment book-to-bill turns first.
2. **Price is lagging confirmation; inventory is the leading signal.** By the
   time DRAM contract prices rise, memory equities have typically already run
   for 6–9 months. Buying on the price turn is buying the top.
3. **For half these industries the constraint is supply, not demand.** AI
   accelerators are not short of orders, they are short of CoWoS. Watch the
   wrong side and the model is inverted.

---

## 4. News tagging

News is only useful if it lands on the tree. Every item carries:

- `companyIds[]` — resolved from ticker and entity mentions
- `industryIds[]` — inherited from the companies, plus direct matches for
  items that are about an industry with no single company (a MARGMA release,
  a WSTS shipment print)
- `driverIds[]` — **the valuable one.** An item that speaks to a tracked
  driver is what turns a headline into a model update.
- `confidence` per tag, because a ticker match is not the same as a fuzzy
  name match

Tagging to a driver is what closes the loop with §5: "Micron guides capex
down 20%" is not just news, it is a reading on a leading driver of DRAM.

**Provenance rule applies unchanged. Done 2026-07-22:** the news page now
reads `GET /v1/news` and `lib/mock/news` is deleted — with it the item
attributed to **MARGMA, a real trade association, making a specific claim
about glove ASP**, which was the same defect as a fabricated citation (a real
source name plus a checkable number reads as true whatever badge sits beside
it). The mock's priority tier, category and country went too: nothing computes
them, so they were six columns of invention.

**And a claim in this document was measured and found false.** The pipeline
comment asserted that a ticker-scoped Yahoo feed "cannot drift onto an
unrelated company the way a keyword search can". It drifts constantly: of the
100 items production had stored, **only 30 mention any company in the coverage
universe** — the NVDA feed carries "SpaceX Is Down 20%" and "Should You Buy
Moderna Stock". Ticker scoping controls the QUERY, not the content.

The consequence for §4 is that the query is provenance, never a tag. Tags come
from the word-boundary match on the headline; an item that matched nothing
renders as "from the NVDA feed", which is what actually happened, and the
page states the 30/100 ratio rather than hiding the 70.

---

## 5. The agent's job, and its cadence

**The agent's output is rows in the database, not messages in a chat.** A
chat answer is spent the moment it is read; a sourced row compounds. The
Industry Agent's KPI is therefore the completeness score on
`industry_knowledge` moving from 25% toward 80% — not "answered well".

### Data frequency ≠ agent frequency

These differ in cost by three orders of magnitude and must never be
conflated:

| | Who | Monthly cost |
| --- | --- | --- |
| Pull series | machine | ~0 (FRED, EIA, BNM are free) |
| Write interpretation | LLM | 35 series × 30 days = 1,050 calls |

Daily commentary is not merely expensive, it is **harmful**: it manufactures
signal from noise and trains the reader to react to it.

### Event-driven, not calendar-driven

The agent writes only when one of these fires:

1. **Threshold** — a driver moves >5% in a month, or hits a 52-week extreme
2. **Turn** — direction changes after a sustained run
3. **Model break** — the stated relationship fails ★

The third is where the value is. Given an explicit expectation ("latex ↑ →
margin ↓, one quarter later"), the system can detect the expectation NOT
being met:

> ⚠ Latex +15% over two quarters, Hartalega's margin did not fall.
> Either they hedged, or they pushed price through, or our model is wrong.

Each of those is a story worth chasing. The trend itself — "latex went up" —
is visible to everyone and carries no information.

Estimated volume across all seven industries: **10–30 events per month**,
30–100× cheaper than daily and every one worth reading. Plus a **weekly
digest** (4 calls/month) assembled from events already fired — the cadence a
human actually reads at.

### Controls are ON/OFF, not a three-step autonomy dial

The console currently offers 提议 / 半自动 / 全自动 per analyst. That gradient
is borrowed from a different problem and should be removed.

Graduated autonomy exists for agents that **act** — place an order, assign a
task, change a record. The steps buy you "let it propose, I approve, then it
executes". **A research agent does not act; it writes knowledge.** Every row
it writes already carries a source, a confidence and a timestamp, and is
reviewable, editable and deletable after the fact. Gating it *before* the
write adds friction without adding safety.

So: one switch per analyst — **on, it researches; off, it does not** — plus
the existing global kill switch, which is a different thing (one analyst
resting vs everything stopping).

**What the dial was actually protecting is cost**, and it protected it
badly — "半自动" does not tell anyone how much anything will cost. Replace it
with an explicit budget:

```
行业研究分析师   [开]   本月 120 / 500 次调用
```

Saying "at most this much this month" is honest in a way that a vague middle
setting is not.

### Every entity mention is a link

A company named on an industry page, in a news item, or inside a driver's
`whoItHits` must navigate to that company. The same for industries and
drivers, in both directions.

This is what makes the knowledge graph usable rather than merely stored: a
graph you cannot walk is a picture of a graph. It is also the cheapest
feature here — the ids are already on every record.

### Backtesting is the honesty mechanism

Because every driver states an expected magnitude and lag, the claim can be
checked against history. A driver whose stated relationship never held is a
driver to remove, not to keep. This is the same discipline as convention #0:
the model is written down so it can be wrong in public.

---

## 6. Cross-industry propagation

One driver usually hits several leaves, and the graph to walk already exists
(`relationship` + the value chain):

```
DRAM spot ↓
  → memory makers: revenue pressure
  → server ODMs: input cost relief
  → and it hints datacenter capex is slowing → networking, power
```

A generic tool cannot do this, because it does not know the coverage universe
or its value chain. This is the part that is Atlas-specific and therefore the
part worth building.

---

## 7. Build order

Deliberately **breadth-first on drivers, depth-last on prose**. Finishing one
industry to 90% leaves six blind spots for months; giving all seven their
drivers takes about a week and covers what decisions actually need.

1. ~~`industry` gains `parentId` + `level`; existing seven hang at L3; add L4
   (DRAM / NAND / HBM, 先进/成熟制程, 前道/后道) and L5 where gloves need it~~
   **DONE 2026-07-23.** 21 nodes: 2 roots, 3 chain segments, the 7 industries,
   9 sub-industries. Source of truth `apps/api/seed/taxonomy.mjs`, shipped in
   migration `0007_industry_tree.sql` (the Worker self-migrates, so production
   picks it up without anyone pasting SQL). Membership **rolls up** — 半导体
   reports the 7 companies under 存储/代工/设备 rather than reading empty.
   Three deviations from the sketch above, each deliberate:
   - **Gloves reach depth 4, not 5** (医疗保健 › 医疗耗材 › 手套 › 丁腈手套).
     Under the splitting rule there is no driver-distinct level between 手套
     and the feedstock split. A real fifth level (检查手套 vs 工业手套 —
     different customer, different cycle) is one row per node if wanted, but
     it should be added because the drivers differ, not to match a number.
   - **Companies still hang on the seven L3 nodes**, not on leaves. Filing
     Micron is a judgement — it makes DRAM, NAND *and* HBM — and the design
     says one company sits at one position. That decision is the owner's;
     roll-up means the tree is already usable and nothing has to move first.
   - **AI 加速器, 网络/ASIC and 数据中心电力 are not split.** One driver set
     covers each today, and another level is another level to maintain.
2. `industry_driver` table per §2; **3–5 drivers per leaf, owner reviews the
   list** — this step decides whether the whole model is right
3. Wire the free feeds (FRED, EIA, BNM first — keys already requested)
4. Industry page renders the driver panel: series + 6M/1Y/5Y + current
   reading + **who it hits and by how much**
5. News tagging (§4) onto the tree
6. Anomaly detection (§5), then propagation (§6)
7. Prose sections last

Export is unconstrained throughout: series are stored at native frequency and
rolled up to daily / weekly / monthly / quarterly on request, which is
aggregation and costs nothing.
