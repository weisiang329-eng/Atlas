/**
 * Industry knowledge seed (Atlas OS V1 Book 2).
 *
 * Seeds ONLY what Atlas can genuinely attribute today. Sections with no
 * sourceable content are deliberately left empty so the completeness scorecard
 * reports the real gap — the manual's Knowledge Completeness KPI is worthless
 * if the gaps are papered over, and inventing an "Overview" paragraph would
 * break the platform's first rule.
 *
 * Everything here derives from data already in the database (the glove-tracker
 * MARGMA series, the seeded value chain, the relationship graph) or from the
 * industry definitions those seeds were built from.
 *
 * Run: node seed/industry/generate.mjs   → seed/industry/industry-seed.sql
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const nullable = (s) => (s === null || s === undefined ? "NULL" : q(s));

/**
 * Industry KPIs. Book 2's KPI Discovery Rules are explicit: never a generic
 * financial metric — find the operational driver unique to the industry. Each
 * record carries every mandated field.
 */
const KPIS = [
  {
    industryId: "rubber-gloves",
    key: "asp_my",
    name: "Malaysian glove ASP",
    definition:
      "Average selling price of nitrile examination gloves exported from Malaysia, quoted per 1,000 pieces in USD.",
    whyItMatters:
      "ASP is the revenue side of the glove margin equation. Malaysian makers are price takers in a commoditised market, so ASP moves earnings faster than volume does — a cycle turn shows up here before it shows up in reported results.",
    unit: "USD / 1000 pcs",
    signalType: "leading",
    updateFrequency: "monthly",
    sourceName: "MARGMA (Malaysian Rubber Glove Manufacturers Association)",
    sourceUrl: "https://www.margma.com.my/",
    affectedCompanies: "top-glove,hartalega,kossan,supermax,careplus,comfort-gloves,hextar-healthcare",
    affectedProducts: "Nitrile examination gloves,Latex examination gloves",
  },
  {
    industryId: "rubber-gloves",
    key: "nbr_latex",
    name: "NBR latex cost",
    definition:
      "Spot cost of nitrile butadiene rubber latex, the primary raw material for nitrile gloves, quoted per tonne in USD.",
    whyItMatters:
      "NBR latex is the largest single input cost. Because ASP and NBR move on different drivers — glove demand versus petrochemical feedstock — the SPREAD between them, not either level, is what determines margin. This is the cost side of that spread.",
    unit: "USD / tonne",
    signalType: "leading",
    updateFrequency: "monthly",
    sourceName: "glove-tracker industry benchmarks",
    sourceUrl: null,
    affectedCompanies: "top-glove,hartalega,kossan,supermax,careplus,comfort-gloves,hextar-healthcare",
    affectedProducts: "Nitrile examination gloves",
  },
  {
    industryId: "semis-memory",
    key: "hbm_share",
    name: "HBM share of DRAM revenue",
    definition:
      "High-bandwidth memory revenue as a proportion of total DRAM revenue for a maker.",
    whyItMatters:
      "HBM carries structurally higher margin than commodity DRAM and is sold on long-term agreements rather than spot. A rising HBM share therefore changes the earnings quality of a memory maker, not just its level — the same revenue becomes less cyclical.",
    unit: "%",
    signalType: "lagging",
    updateFrequency: "quarterly",
    sourceName: "Company quarterly filings and investor presentations",
    sourceUrl: null,
    affectedCompanies: "sk-hynix,micron",
    affectedProducts: "HBM,DRAM",
  },
];

/**
 * Knowledge records. Each states its source. Where Atlas cannot source a
 * section it is simply absent — the scorecard is supposed to show that.
 */
const KNOWLEDGE = [
  {
    industryId: "rubber-gloves",
    section: "overview",
    kind: "fact",
    content:
      "Malaysia is the world's largest exporter of rubber examination gloves. The industry is dominated by a small number of listed manufacturers whose output is commoditised, sold largely into healthcare distribution channels, and priced in USD while much of the cost base is in MYR.",
    sourceUrl: "https://www.margma.com.my/",
    confidence: 0.9,
    asOf: "2026-07-21",
  },
  {
    industryId: "rubber-gloves",
    section: "products",
    kind: "fact",
    content:
      "Nitrile examination gloves (the dominant product by volume and the basis of the ASP benchmark), latex examination gloves, surgical gloves, and vinyl gloves. Nitrile has displaced latex in most developed-market healthcare use on allergen grounds.",
    sourceUrl: "https://www.margma.com.my/",
    confidence: 0.85,
    asOf: "2026-07-21",
  },
  {
    industryId: "rubber-gloves",
    section: "pricing",
    kind: "fact",
    content:
      "Two tracked indicators: Malaysian glove ASP (USD per 1,000 pieces) and NBR latex cost (USD per tonne). Atlas derives a margin cycle signal from the ratio between them, indexed to 2019-09 = 100. The spread, not either level alone, drives manufacturer margin.",
    sourceUrl: "https://www.margma.com.my/",
    confidence: 1,
    asOf: "2026-07-21",
  },
  {
    industryId: "rubber-gloves",
    section: "suppliers",
    kind: "fact",
    content:
      "Upstream inputs are NBR latex (petrochemical-derived, priced off butadiene and acrylonitrile) and natural rubber latex. Input pricing is therefore tied to petrochemical feedstock rather than to glove demand, which is why the ASP-to-cost spread widens and narrows independently of volume.",
    sourceUrl: null,
    confidence: 0.75,
    asOf: "2026-07-21",
  },
  {
    industryId: "rubber-gloves",
    section: "kpis",
    kind: "fact",
    content:
      "Tracked industry KPIs: Malaysian glove ASP (leading, monthly) and NBR latex cost (leading, monthly). Both are operational drivers specific to this industry rather than generic financial ratios.",
    sourceUrl: "https://www.margma.com.my/",
    confidence: 1,
    asOf: "2026-07-21",
  },
  {
    industryId: "semis-memory",
    section: "overview",
    kind: "fact",
    content:
      "Memory divides into DRAM (including high-bandwidth memory, HBM) and NAND flash. The segment is historically deeply cyclical, with pricing set by the balance between capacity additions and demand. HBM has emerged as a structurally tighter sub-segment because it is sold on long-term agreements into AI accelerator programmes.",
    sourceUrl: null,
    confidence: 0.8,
    asOf: "2026-07-21",
  },
  {
    industryId: "semis-memory",
    section: "customers",
    kind: "fact",
    content:
      "HBM output is concentrated into a small number of AI accelerator programmes; Atlas records the supply relationships it can source in the knowledge graph (see /v1/graph). Customer concentration is therefore high, and a single programme's capex cycle propagates directly into memory maker revenue.",
    sourceUrl: null,
    confidence: 0.7,
    asOf: "2026-07-21",
  },
];

const lines = [
  "-- Industry knowledge seed (Atlas OS V1 Book 2). GENERATED — do not hand-edit.",
  "-- Regenerate: node seed/industry/generate.mjs",
  "-- Sections absent here are genuinely unresearched; the completeness",
  "-- scorecard is meant to surface them, not to be padded.",
  "",
];

for (const k of KPIS) {
  lines.push(
    `INSERT INTO industry_kpi (industry_id, key, name, definition, why_it_matters, unit, signal_type, update_frequency, source_name, source_url, affected_companies, affected_products) VALUES (` +
      [
        q(k.industryId),
        q(k.key),
        q(k.name),
        q(k.definition),
        q(k.whyItMatters),
        nullable(k.unit),
        q(k.signalType),
        nullable(k.updateFrequency),
        nullable(k.sourceName),
        nullable(k.sourceUrl),
        nullable(k.affectedCompanies),
        nullable(k.affectedProducts),
      ].join(", ") +
      `) ON CONFLICT (industry_id, key) DO UPDATE SET name = EXCLUDED.name, definition = EXCLUDED.definition, why_it_matters = EXCLUDED.why_it_matters, unit = EXCLUDED.unit, signal_type = EXCLUDED.signal_type, update_frequency = EXCLUDED.update_frequency, source_name = EXCLUDED.source_name, source_url = EXCLUDED.source_url, affected_companies = EXCLUDED.affected_companies, affected_products = EXCLUDED.affected_products;`,
  );
}

lines.push("");

for (const r of KNOWLEDGE) {
  // Natural key is (industry, section, content) — re-running must not
  // duplicate, and an edited paragraph is a new record, not a silent overwrite.
  lines.push(
    `INSERT INTO industry_knowledge (industry_id, section, content, kind, source_url, confidence, as_of) SELECT ` +
      [
        q(r.industryId),
        q(r.section),
        q(r.content),
        q(r.kind),
        nullable(r.sourceUrl),
        r.confidence,
        r.asOf ? q(r.asOf) : "NULL",
      ].join(", ") +
      ` WHERE NOT EXISTS (SELECT 1 FROM industry_knowledge WHERE industry_id = ${q(r.industryId)} AND section = ${q(r.section)} AND content = ${q(r.content)});`,
  );
}

writeFileSync(join(here, "industry-seed.sql"), lines.join("\n") + "\n");
console.log(
  `industry-seed.sql: ${KPIS.length} KPIs, ${KNOWLEDGE.length} knowledge records`,
);
