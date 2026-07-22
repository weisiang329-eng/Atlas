/**
 * Verifies driver series computed from stored filings — tier 4 of the
 * sourcing ADR, and the cheapest data Atlas will ever have.
 *
 * The risk here is not a wrong number, it is a number that looks like the one
 * it replaced. Maker inventory days stands in for channel inventory weeks, so
 * every entry must carry what it ACTUALLY measures, and the tests below pin
 * that as hard as they pin the arithmetic.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  DERIVATIONS,
  DERIVATION_BY_KEY,
  deriveSeries,
} from "../src/domain/derived-series.ts";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- every derivation states what it actually measures ---");
{
  check("keys are unique", new Set(DERIVATIONS.map(d => d.key)).size, DERIVATIONS.length);
  check("each declares a unit", DERIVATIONS.every(d => d.unit.length > 0), true);
  // The anti-relabelling guard: a one-line `measures` is not enough to
  // explain how a substitute differs from the thing it replaces.
  check("each explains itself in more than a label",
    DERIVATIONS.every(d => d.measures.length > 80), true);
  check("inventory days says it is NOT channel inventory",
    /not channel inventory/i.test(DERIVATION_BY_KEY.get("inventory_days").measures), true);
  check("fab capex admits its coverage gap",
    /not global fab capex/i.test(DERIVATION_BY_KEY.get("fab_capex").measures), true);
}

console.log("\n--- the arithmetic ---");
{
  const dsi = DERIVATION_BY_KEY.get("inventory_days");
  check("DSI = inventory ÷ COGS × 91",
    dsi.perPeriod({ Inventory: 1000, CostOfRevenue: 2000 }), 45.5);
  check("no COGS ⇒ no value (never a zero that would drag an average)",
    dsi.perPeriod({ Inventory: 1000 }), undefined);
  check("zero COGS ⇒ no value, not infinity",
    dsi.perPeriod({ Inventory: 1000, CostOfRevenue: 0 }), undefined);
}

console.log("\n--- companies are combined the way the claim means ---");
{
  const q = (quarter, facts) => ({ reportDate: null, fiscalYear: null, fiscalQuarter: null, ...facts, quarter });
  const mk = (companyId, rows) => ({
    companyId,
    fiscalYearEndMonth: 12,
    periods: rows.map(([fy, fq, facts]) => ({
      reportDate: null, fiscalYear: fy, fiscalQuarter: fq, facts,
    })),
  });

  // Big maker at 45 days, small one at 180. Weighted by revenue, the industry
  // reads near the big one — an unweighted mean would say 112.
  const dsi = deriveSeries(DERIVATION_BY_KEY.get("inventory_days"), [
    mk("big", [[2024, 1, { Inventory: 1000, CostOfRevenue: 2000, Revenue: 5000 }]]),
    mk("small", [[2024, 1, { Inventory: 200, CostOfRevenue: 101, Revenue: 100 }]]),
  ]);
  check("one observation per calendar quarter", dsi.map(o => o.quarter), ["2024Q1"]);
  check("revenue-weighted, so the big maker sets the level", dsi[0].value, (v) => v > 45 && v < 60);

  const capex = deriveSeries(DERIVATION_BY_KEY.get("maker_capex"), [
    mk("a", [[2024, 1, { Capex: 100 }], [2024, 2, { Capex: 150 }]]),
    mk("b", [[2024, 1, { Capex: 40 }]]),
  ]);
  check("capex sums across makers", capex, [
    { quarter: "2024Q1", value: 140 }, { quarter: "2024Q2", value: 150 },
  ]);

  // Fiscal calendars differ; a derivation that ignored them would add
  // NVIDIA's April quarter to Intel's March quarter and call it Q1.
  const shifted = deriveSeries(DERIVATION_BY_KEY.get("maker_capex"), [
    { companyId: "nvda", fiscalYearEndMonth: 1, periods: [{ reportDate: null, fiscalYear: 2019, fiscalQuarter: 1, facts: { Capex: 10 } }] },
    { companyId: "intc", fiscalYearEndMonth: 12, periods: [{ reportDate: null, fiscalYear: 2018, fiscalQuarter: 2, facts: { Capex: 20 } }] },
  ]);
  check("fiscal quarters are aligned before summing", shifted, [{ quarter: "2018Q2", value: 30 }]);

  check("a period with none of the inputs is skipped, not zeroed",
    deriveSeries(DERIVATION_BY_KEY.get("maker_capex"), [mk("a", [[2024, 1, { Revenue: 5 }]])]), []);
  void q;
}

console.log("\n--- against the real database ---");
{
  const db = new PGlite();
  for (const m of [
    "drizzle/0000_init_postgres.sql", "drizzle/0007_industry_tree.sql",
    "drizzle/0008_industry_driver.sql", "drizzle/0009_driver_list.sql",
    "drizzle/0010_fiscal_year_end.sql", "drizzle/0011_driver_blockers.sql",
    "drizzle/0012_blocker_truth.sql",
  ]) await db.exec(read(m));
  await db.exec(read("drizzle/0012_blocker_truth.sql")); // replay is a no-op
  for (const s of ["seed/seed.sql", "seed/edgar/edgar-seed.sql", "seed/glove/glove-seed.sql"]) {
    await db.exec(read(s));
  }

  const rows = (await db.query(
    `SELECT blocker, count(*)::int n FROM industry_driver GROUP BY blocker ORDER BY blocker`)).rows;
  const by = Object.fromEntries(rows.map(r => [r.blocker, r.n]));
  console.log("  · blockers after the correction:", JSON.stringify(by));

  // 0011 claimed 15 drivers needed only code. Writing the code proved that
  // wrong, and the correction is the point of 0012.
  check("needs-extraction is now the small honest number it should be",
    by["needs-extraction"], (v) => v <= 2);
  check("what actually needs new COVERAGE is named as such",
    by["needs-coverage"], 3);
  check("and five drivers became genuinely testable", by.none, 7);

  const derivable = (await db.query(
    `SELECT industry_id AS ind, key, series_key AS sk FROM industry_driver
     WHERE source_id = 'derived-filings' AND blocker = 'none' ORDER BY industry_id, key`)).rows;
  check("every derivable driver has a series_key that resolves to a derivation",
    derivable.every(r => DERIVATION_BY_KEY.has(r.sk)), true);
  check("five of them", derivable.length, 5);

  // The bug this caught: a blocker of `none` with a NULL series_key looks
  // solved and produces nothing.
  check("no driver claims to be unblocked without a series key",
    (await db.query(
      "SELECT count(*)::int n FROM industry_driver WHERE blocker = 'none' AND series_key IS NULL")).rows[0].n, 0);

  await db.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
