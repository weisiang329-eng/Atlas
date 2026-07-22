/**
 * Verifies fiscal-calendar alignment — the join key for every cross-company
 * quarterly comparison.
 *
 * This exists because of a silent hole: the EDGAR seed writes 402 quarterly
 * periods with fiscal_year and fiscal_quarter and NO report_date, so every US
 * industry's quarterly margin history was empty and the driver backtest said
 * "insufficient data" for a reason that had nothing to do with the data.
 *
 * The dangerous failure here is not an empty series, it is a WRONG one: place
 * NVIDIA's Q1 (ends April) in the same bucket as Intel's Q1 (ends March) and
 * the industry margin becomes an artefact that still looks like a number.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  calendarQuarterOfDate,
  calendarQuarterOfFiscal,
  placePeriod,
} from "../src/domain/fiscal.ts";
import { industryNetMargin } from "../src/domain/drivers.ts";
import { fiscalQuarterOf } from "../src/ingest/edgar-quarters.ts";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- fiscal quarter → calendar quarter ---");
// NVIDIA's fiscal year ends in January: FY19 Q1 ended 2018-04-29.
check("NVDA FY19 Q1 lands in 2018Q2", calendarQuarterOfFiscal(2019, 1, 1), "2018Q2");
check("NVDA FY19 Q4 lands in 2019Q1", calendarQuarterOfFiscal(2019, 4, 1), "2019Q1");
// December filers are the easy case.
check("Intel FY24 Q1 lands in 2024Q1", calendarQuarterOfFiscal(2024, 1, 12), "2024Q1");
check("Intel FY24 Q4 lands in 2024Q4", calendarQuarterOfFiscal(2024, 4, 12), "2024Q4");
// Micron's fiscal year ends around August/September.
check("Micron FY24 Q1 lands in 2023Q4", calendarQuarterOfFiscal(2024, 1, 9), "2023Q4");
check("Micron FY24 Q4 lands in 2024Q3", calendarQuarterOfFiscal(2024, 4, 9), "2024Q3");
// Broadcom ends in early November.
check("Broadcom FY24 Q1 lands in 2024Q1", calendarQuarterOfFiscal(2024, 1, 11), "2024Q1");
check("nonsense input yields nothing", calendarQuarterOfFiscal(2024, 7, 12), null);
check("a bad month yields nothing", calendarQuarterOfFiscal(2024, 1, 13), null);

console.log("\n--- it is the exact inverse of the ingestion's own mapping ---");
{
  // fiscalQuarterOf turns a filed end date into (fy, q); this must return the
  // calendar quarter that date was in. If the two ever disagree, quarters
  // ingested live and quarters derived from the seed would land differently.
  const cases = [
    ["2018-04-29", 1], ["2019-01-27", 1], ["2024-03-30", 12],
    ["2024-12-28", 12], ["2023-11-30", 9], ["2024-08-29", 9], ["2024-02-04", 11],
  ];
  const mismatches = cases.filter(([iso, fyEnd]) => {
    const fq = fiscalQuarterOf(iso, fyEnd);
    if (!fq) return true;
    return calendarQuarterOfFiscal(fq.fy, fq.q, fyEnd) !== calendarQuarterOfDate(iso);
  });
  check("round-trip agrees for every real filing date", mismatches, []);
}

console.log("\n--- placement prefers the filed date and never invents one ---");
{
  const filed = placePeriod(
    { reportDate: "2024-05-31", fiscalYear: 2024, fiscalQuarter: 3 },
    12,
  );
  check("a filed date wins", [filed.quarter, filed.derived], ["2024Q2", false]);

  const derived = placePeriod(
    { reportDate: null, fiscalYear: 2019, fiscalQuarter: 1 },
    1,
  );
  check("no date falls back to the fiscal calendar", [derived.quarter, derived.derived], ["2018Q2", true]);

  const hopeless = placePeriod(
    { reportDate: null, fiscalYear: 2024, fiscalQuarter: 1 },
    null,
  );
  check("no date AND no fiscal calendar is unplaceable, not guessed", hopeless.quarter, null);
}

console.log("\n--- against the real database ---");
{
  const db = new PGlite();
  for (const m of [
    "drizzle/0000_init_postgres.sql",
    "drizzle/0007_industry_tree.sql",
    "drizzle/0010_fiscal_year_end.sql",
  ]) await db.exec(read(m));
  await db.exec(read("drizzle/0010_fiscal_year_end.sql")); // replay is a no-op
  for (const s of ["seed/seed.sql", "seed/edgar/edgar-seed.sql", "seed/glove/glove-seed.sql"]) {
    await db.exec(read(s));
  }

  const one = async (sql) => (await db.query(sql)).rows[0];
  check("US filers carry a fiscal year end",
    (await one("SELECT count(*)::int n FROM company WHERE fiscal_year_end_month IS NOT NULL")).n,
    (v) => v === 9); // 7 US filers + Top Glove and Hartalega (the only two the repo sources)

  // The hole this suite exists for: quarterly periods with no filed date.
  const undated = (await one(
    "SELECT count(*)::int n FROM financial_period WHERE period_type='quarter' AND report_date IS NULL")).n;
  check("undated quarterly periods still exist (the seed writes none)", undated, (v) => v > 300);

  const rows = (await db.query(`
    SELECT p.company_id AS "companyId", p.report_date AS "reportDate",
           p.fiscal_year AS "fiscalYear", p.fiscal_quarter AS "fiscalQuarter",
           c.fiscal_year_end_month AS "fyEnd",
           max(CASE WHEN f.concept='Revenue' THEN f.value END) AS revenue,
           max(CASE WHEN f.concept='NetIncome' THEN f.value END) AS net
    FROM financial_period p
    JOIN company c ON c.id = p.company_id
    JOIN financial_fact f ON f.period_id = p.id
    WHERE p.period_type = 'quarter' AND c.industry_id = 'semis-memory'
    GROUP BY p.id, p.company_id, p.report_date, p.fiscal_year, p.fiscal_quarter, c.fiscal_year_end_month
  `)).rows;

  const placed = rows.map((r) => ({
    quarter: placePeriod(r, r.fyEnd).quarter,
    facts: { Revenue: r.revenue, NetIncome: r.net },
  }));
  const memory = industryNetMargin(placed);

  // Before this change every one of these dropped out and the industry had no
  // margin history at all.
  check("存储 now has a quarterly margin history", memory.length, (v) => v > 20);
  check("and it is ordered, contiguous-ish, and plausible",
    [memory[0].quarter < memory[memory.length - 1].quarter,
     memory.every((o) => Math.abs(o.value) < 100)],
    [true, true]);
  console.log(`  · 存储: ${memory.length} quarters, ${memory[0].quarter}–${memory[memory.length - 1].quarter}`);

  // A company with no confirmed fiscal calendar must not be placed by guess.
  const skhynix = (await one(
    "SELECT fiscal_year_end_month AS m FROM company WHERE id = 'sk-hynix'")).m;
  check("SK hynix has no assumed fiscal calendar", skhynix, null);

  await db.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
