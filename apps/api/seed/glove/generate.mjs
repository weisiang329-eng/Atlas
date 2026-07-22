/**
 * Generates glove-seed.sql (Postgres) from fundamentals.json (P026 Phase 1).
 *
 * Idempotent upserts: rubber-gloves industry + 7 Malaysian glove companies,
 * a source row per company (kind='glove-tracker'), quarterly periods+facts
 * straight from the rows, and annual periods aggregated for complete fiscal
 * years. Facts resolve their period by natural key (no hard-coded ids).
 *
 *   node seed/glove/generate.mjs   # then run glove-seed.sql in Supabase
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GLOVE_COMPANIES, GLOVE_INDUSTRY } from "./companies.mjs";
import { HEADER, n, q, upsert, upsertFacts, upsertPeriod } from "../pg.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const { rows } = JSON.parse(readFileSync(join(here, "fundamentals.json"), "utf8"));

/** "Q2 FY26" -> { fq: 2, fy: 2026 } (labels are per-company fiscal calendars). */
function parseQuarter(label) {
  const m = /^Q([1-4])\s+FY(\d{2})$/.exec(label ?? "");
  if (!m) return null;
  return { fq: Number(m[1]), fy: 2000 + Number(m[2]) };
}

function factsOf(r) {
  const facts = {};
  if (typeof r.revenue_mil === "number") facts.Revenue = r.revenue_mil;
  if (typeof r.revenue_mil === "number" && typeof r.gross_profit_mil === "number") {
    facts.CostOfRevenue = Number((r.revenue_mil - r.gross_profit_mil).toFixed(3));
  }
  if (typeof r.operating_profit_mil === "number")
    facts.OperatingIncome = r.operating_profit_mil;
  if (typeof r.net_profit_mil === "number") facts.NetIncome = r.net_profit_mil;
  return facts;
}

const lines = [HEADER("seed/glove/generate.mjs")];
lines.push(
  upsert(
    "industry",
    {
      id: q(GLOVE_INDUSTRY.id),
      name: q(GLOVE_INDUSTRY.name),
      sector: q(GLOVE_INDUSTRY.sector),
      description: q(GLOVE_INDUSTRY.description),
      chain_order: n(null),
    },
    ["id"],
    ["name", "sector", "description"],
  ),
);

let quarterCount = 0;
let annualCount = 0;
let factCount = 0;

for (const c of GLOVE_COMPANIES) {
  const mine = rows
    .filter((r) => r.stock_code === c.code && parseQuarter(r.quarter))
    .sort((a, b) => (a.period_end < b.period_end ? -1 : 1));
  if (mine.length === 0) continue;

  const latest = mine[mine.length - 1];
  const sourceId = `glove-tracker-${c.id}`;
  lines.push(
    upsert(
      "source",
      {
        id: q(sourceId),
        kind: q("glove-tracker"),
        name: q(`glove-tracker import — ${c.name} Bursa quarterly reports`),
        url: q(latest.source_url ?? "https://www.bursamalaysia.com"),
        retrieved_at: q((latest.retrieved_at ?? "").slice(0, 10) || "2026-04-20"),
        note: q(
          "Imported from weisiang329-eng/glove-tracker (data/fund.json, is_mock=0 rows only). Original source: Bursa Malaysia quarterly report PDFs, auto-parsed. See apps/api/seed/glove/fundamentals.json for per-row provenance.",
        ),
      },
      ["id"],
      ["kind", "name", "url", "retrieved_at", "note"],
    ),
  );
  lines.push(
    upsert(
      "company",
      {
        id: q(c.id),
        name: q(c.name),
        ticker: q(c.ticker),
        exchange: q(c.exchange),
        segment: q(c.segment),
        country: q(c.country),
        industry_id: q(GLOVE_INDUSTRY.id),
        description: q(c.description),
        reporting_currency: q("MYR"),
        fiscal_year_end_month: c.fyEndMonth ?? "NULL",
      },
      ["id"],
      ["name", "ticker", "exchange", "segment", "country", "industry_id", "description", "reporting_currency", "fiscal_year_end_month"],
    ),
  );

  // Quarterly periods + facts.
  const byFY = new Map();
  for (const r of mine) {
    const pq = parseQuarter(r.quarter);
    lines.push(
      upsertPeriod({
        companyId: c.id,
        periodLabel: r.quarter,
        periodType: "quarter",
        fiscalYear: pq.fy,
        fiscalQuarter: pq.fq,
        currency: "MYR",
        unit: "MYR millions",
        reportDate: r.period_end,
        sourceId,
      }),
    );
    const facts = factsOf(r);
    const factSql = upsertFacts(c.id, r.quarter, facts, sourceId);
    if (factSql) {
      lines.push(factSql);
      factCount += Object.keys(facts).length;
    }
    quarterCount += 1;

    const fyGroup = byFY.get(pq.fy) ?? [];
    fyGroup.push({ r, facts });
    byFY.set(pq.fy, fyGroup);
  }

  // Annual aggregation — only complete fiscal years (4 distinct quarters).
  for (const [fy, group] of [...byFY.entries()].sort((a, b) => a[0] - b[0])) {
    const quarters = new Set(group.map((g) => parseQuarter(g.r.quarter).fq));
    if (quarters.size !== 4 || group.length !== 4) continue;
    const sum = {};
    for (const concept of ["Revenue", "CostOfRevenue", "OperatingIncome", "NetIncome"]) {
      if (group.every((g) => typeof g.facts[concept] === "number")) {
        sum[concept] = Number(group.reduce((a, g) => a + g.facts[concept], 0).toFixed(3));
      }
    }
    if (Object.keys(sum).length === 0) continue;
    const label = `FY${String(fy).slice(2)}`;
    const lastEnd = group.map((g) => g.r.period_end).sort().at(-1);
    lines.push(
      upsertPeriod({
        companyId: c.id,
        periodLabel: label,
        periodType: "annual",
        fiscalYear: fy,
        fiscalQuarter: null,
        currency: "MYR",
        unit: "MYR millions",
        reportDate: lastEnd,
        sourceId,
      }),
    );
    lines.push(upsertFacts(c.id, label, sum, sourceId));
    factCount += Object.keys(sum).length;
    annualCount += 1;
  }
}

const out = join(here, "glove-seed.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(
  `Wrote ${out}: ${GLOVE_COMPANIES.length} companies, ${quarterCount} quarterly periods, ${annualCount} annual periods, ${factCount} facts.`,
);
