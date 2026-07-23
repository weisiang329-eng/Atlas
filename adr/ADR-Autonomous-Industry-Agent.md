# ADR: How the Industry agent may keep industry knowledge fresh — safely

**Status:** Proposed (design only — nothing built yet). Awaiting owner review.
**Date:** 2026-07-23
**Related:** [`ADR-Data-Sourcing-Cost.md`](ADR-Data-Sourcing-Cost.md) (convention
#8), convention #1 (never fabricate), programs P020 (agent runtime, built),
P021 (agent memory), P024 (automation).

---

## The question the owner asked

> "The industry classification is done — is all the industry information and the
> charts there? And does the **industry agent** keep them updated on a schedule?"

Honest current state (verified in code 2026-07-23):

- **Classification / tree:** built (migration `0007`, 21 nodes, roll-up).
- **Information & charts:** the *framework* is complete (endpoints `/:id`,
  `/:id/metrics`, `/:id/drivers`, `/:id/knowledge`, `/tree`, `/value-chain`;
  chart components exist). **Real data behind them exists for 3 areas only** —
  gloves (seeded ASP + latex), memory and equipment (series *derived* from
  stored filings). The other four industries have driver *definitions* but empty
  series, because their inputs are paid / unavailable / need a free key
  (see the pending audit in HANDOFF §13).
- **The Industry Research Analyst agent** (`agent/analysts.ts`) exists, and its
  own spec already lists *"Industry database, Industry KPI database, Knowledge
  graph nodes"* as **deliverables**. But today the agent is **read-only**: every
  tool in `agent/tools.ts` is a `get_*`, the runtime (`agent/runtime.ts`) is a
  Q&A tool-use loop, and **nothing schedules it**. The only Workers Cron job on
  the platform is the news refresh (PR #98).

So: the agent *can answer* industry questions; it cannot *write* or *update*
anything, and it is not on a schedule. Wiring it to do so is the subject of this
ADR — and it cannot be a naive "turn the LLM loose to update the database,"
because that collides head-on with the platform's first rule.

## The hard constraint (why this needs a design, not a switch)

**Convention #1: never fabricate a number for a real company; every value traces
to a `source` row.** An LLM that autonomously *writes* industry facts is the
single highest fabrication risk in the whole system. A model asked to "update
DRAM contract prices" will happily emit a fluent, plausible, **wrong** number —
and "a plausible number that is wrong is the worst defect." The runtime already
tells the model *"Ground every number in a tool result. Never invent figures"* —
but that is a **prompt**, and a prompt is not a guarantee. For writes, the
guarantee has to be **structural**: it must be impossible for the agent to land
an unsourced number in a live fact table, no matter what it generates.

## Decision: writes are typed by trust, and provenance is enforced by the tool, not the prompt

Every agent write carries a `source` row (the schema already supports this;
`source.kind ∈ {seed, sec-edgar, glove-tracker, fred, manual, estimate, …}`).
The write path is split into three tiers by how the value was obtained:

### Tier A — transcribed from a primary source → **auto-commit**
A value the agent copied verbatim from a source **it fetched during this run**:
an SEC XBRL figure, a FRED series point, an exchange open-data value. This is
transcription, not inference, so it is safe to commit live.

Enforced by two new mechanics:
1. **`fetch_source(url)` tool** — the ONLY way the agent obtains external data.
   It runs through the Worker's existing `politeFetch` + the `/v1/ingest/probe`
   allowlist, so the agent can only reach **free, reachable, non-paid** sources
   (a paid TrendForce URL is not on the allowlist; Google News is 503-blocked;
   etc.). Returns the fetched content **and a fetch-receipt token**.
2. **Write tools require a matching receipt** — e.g.
   `commit_industry_metric({ industryId, metricKey, value, observationDate,
   fetchReceipt })`. The tool re-derives provenance from the receipt (URL, kind,
   retrievedAt), writes the `source` row itself, and **rejects any write whose
   value cannot be located in the fetched content**. No fetch → no receipt → no
   write. The number cannot be model-authored.

### Tier B — the agent's synthesis / judgement → **propose-only, human review**
Industry definitions, lifecycle narratives, supply-chain edges, "market share
≈ X%," a KPI the agent *reasons* to rather than reads. These are legitimate
research output but they are **inference**, so they never touch a live fact
table. They write to a **staging table** (`proposed_knowledge`, status =
`proposed`, `source.kind = 'estimate'`, carrying the agent's cited reasoning and
run id) and surface in a **review queue** (`GET /v1/review/queue`). The owner (or
the Coordinator analyst) approves → promoted to live; rejects → discarded.
Nothing Tier B is ever indistinguishable from sourced fact, and nothing goes
live without a human.

### Tier C — recalled paid/opaque data → **forbidden**
A paid-source figure (TrendForce ASP, SEMI book-to-bill) the model "knows" from
training. **Banned outright** — it violates #8 (cost) and #1 (unverifiable). The
driver stays `blocker: paid` and says so. The agent must not launder training
recall into a fact; the `fetch_source` allowlist makes the *sourced* path
impossible for these, and Tier B review catches any that leak in as prose.

## Scheduling

Reuse the exact pattern PR #98 established: a `scheduled` handler in
`src/index.ts` (its own pooled connection, `ensureSchema` first, errors logged
not thrown), plus a `[triggers] crons` entry. A **weekly** per-industry tick runs
the agent with a **bounded step + token budget** (an `AGENT_RUN_BUDGET` analog to
`AGENT_DAILY_LIMIT`), commits Tier A, queues Tier B. Weekly, not hourly:
industry structure moves slowly and every run costs Anthropic tokens.

## Audit

Every agent write is attributable: `source` row (kind + url + retrievedAt) +
agent-run id + timestamp. A run produces a summary (what it fetched, what it
committed, what it queued, what it skipped and why) logged like the news cron.
Nothing the agent writes is anonymous or indistinguishable from human-seeded
data.

## Incremental build path (not one giant risky PR)

1. **P1 — Tier A, manual trigger.** `fetch_source` + one `commit_*` write tool
   (metric), receipt enforcement, no schedule. Prove it on one industry — e.g.
   refresh a FRED-keyed series *once the owner adds `FRED_API_KEY`*. Small,
   reviewable, no autonomy yet.
2. **P2 — Tier B staging + review.** `proposed_knowledge` table, review endpoint,
   a minimal review UI. Still manually triggered.
3. **P3 — schedule.** Add the `scheduled` tick + cron once P1/P2 are trusted.
4. **P4 — widen.** More industries, more write tools (supply edges, events),
   as free sources come online.

Each step is independently shippable and reviewable; autonomy is switched on
**last**, only after the guardrails are proven.

## What this deliberately does NOT do

- It does **not** make the four data-starved industries suddenly have charts.
  An agent cannot conjure CoWoS capacity or paid ASP; those stay blocked. This
  makes the **free-sourceable** knowledge self-maintaining and puts the agent's
  *inferences* in front of the owner — it does not repeal convention #8.
- It does **not** let the agent write live data without either a fetched source
  (Tier A) or a human approval (Tier B). That property is the whole point.

## Relationship to the simpler deterministic refresh

The "recompute derived series on a cron" job discussed with the owner is just
**Tier A's simplest special case** — deterministic arithmetic over already-stored
filings, no LLM, no fetch. It can ship first and independently (it is pure and
safe) and gives the three data-bearing industries auto-freshness now. The agent
is the general case for the research that *cannot* be reduced to a formula.

## Consequences

- **Positive:** moves the platform toward its AI-native goal (autonomous
  research) without ever trading away the credibility that is its entire value.
  The owner reviews judgement calls, not transcription.
- **Cost:** real engineering (fetch-receipt plumbing, staging + review surface,
  scheduled runs) and ongoing Anthropic tokens per run. Bounded by budget caps.
- **Risk if built naively instead:** an autonomous LLM writing unsourced
  industry "facts" would quietly poison the knowledge base with plausible-wrong
  numbers — the exact failure convention #1 exists to prevent. This ADR exists so
  that does not happen.
