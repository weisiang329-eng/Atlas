/**
 * Verifies the Postgres migration + all seeds against a real Postgres engine
 * (PGlite / WASM) — no external database needed. If this passes, the same SQL
 * runs on Supabase. Run: node seed/test-pg.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

const migrations = [
  "drizzle/0000_init_postgres.sql",
  "drizzle/0001_agent_usage.sql",
  "drizzle/0002_pms.sql",
  "drizzle/0003_agent_console.sql",
  "drizzle/0004_industry_knowledge.sql",
  // 0005/0006 are reference data and the news/FX tables — neither is exercised
  // by this suite. 0007 is, because it turns the taxonomy into a tree and the
  // seeds below upsert onto it.
  "drizzle/0007_industry_tree.sql",
  "drizzle/0008_industry_driver.sql",
  "drizzle/0009_driver_list.sql",
  "drizzle/0010_fiscal_year_end.sql",
];
const seeds = [
  "seed/seed.sql",
  "seed/edgar/edgar-seed.sql",
  "seed/glove/glove-seed.sql",
  "seed/glove/industry-metrics.sql",
  "seed/graph/graph-seed.sql",
  "seed/industry/industry-seed.sql",
];

let failures = 0;
const check = (label, actual, expected) => {
  const ok = expected(actual);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const db = new PGlite();
console.log("applying migrations...");
for (const m of migrations) await db.exec(read(m));

for (const s of seeds) {
  process.stdout.write(`applying ${s}... `);
  await db.exec(read(s));
  console.log("ok");
}
// Re-apply one seed to prove idempotency (upserts must not error or duplicate).
await db.exec(read("seed/seed.sql"));

const one = async (sql) => (await db.query(sql)).rows[0];

console.log("\n--- verification ---");
check("companies", (await one("SELECT count(*)::int n FROM company")).n, (v) => v === 17);
// 21 = the 7 industries + 2 roots + 3 chain segments + 9 sub-industries. The
// tree's shape is asserted in test-taxonomy.mjs; this only guards the count.
check("industry nodes", (await one("SELECT count(*)::int n FROM industry")).n, (v) => v === 21);
check(
  "the 7 company-bearing industries are unchanged",
  (await one("SELECT count(*)::int n FROM industry WHERE level = 3")).n,
  (v) => v === 7,
);
// Drivers ship with migration 0008; the model and its backtest are asserted
// in test-drivers.mjs. This only proves the migration lands with the seeds.
check(
  "glove drivers seeded",
  (await one("SELECT count(*)::int n FROM industry_driver WHERE industry_id = 'rubber-gloves'")).n,
  (v) => v === 4,
);
check(
  "every §3 leaf carries drivers (0009)",
  (await one("SELECT count(DISTINCT industry_id)::int n FROM industry_driver")).n,
  (v) => v === 10,
);
check("relationships", (await one("SELECT count(*)::int n FROM relationship")).n, (v) => v === 23);
check("industry_metric points", (await one("SELECT count(*)::int n FROM industry_metric")).n, (v) => v === 59);
check(
  "financial_fact rows (>3000)",
  (await one("SELECT count(*)::int n FROM financial_fact")).n,
  (v) => v > 3000,
);

// EDGAR extended NVDA to FY26 = 215,938 revenue.
const nvdaFy26 = await one(`
  SELECT f.value FROM financial_fact f
  JOIN financial_period p ON p.id = f.period_id
  WHERE p.company_id = 'nvidia' AND p.period_label = 'FY26' AND f.concept = 'Revenue'`);
check("NVDA FY26 revenue", nvdaFy26?.value, (v) => Math.round(v) === 215938);

// Idempotency: NVDA FY22 must have exactly one Revenue fact after double-seed.
const dupCheck = await one(`
  SELECT count(*)::int n FROM financial_fact f
  JOIN financial_period p ON p.id = f.period_id
  WHERE p.company_id = 'nvidia' AND p.period_label = 'FY22' AND f.concept = 'Revenue'`);
check("no duplicate facts after re-seed", dupCheck.n, (v) => v === 1);

// Value chain: 6 industries carry a chain_order.
check(
  "value-chain stages",
  (await one("SELECT count(*)::int n FROM industry WHERE chain_order IS NOT NULL")).n,
  (v) => v === 6,
);

// Top Glove quarterly depth (P026): 93 quarters.
check(
  "TOPGLOV quarterly periods",
  (await one("SELECT count(*)::int n FROM financial_period WHERE company_id='top-glove' AND period_type='quarter'")).n,
  (v) => v === 93,
);

// Agent usage metering (0001): upsert increments per (ip, day).
await db.exec(
  `INSERT INTO agent_usage (ip, count) VALUES ('203.0.113.7', 1)
   ON CONFLICT (ip, day) DO UPDATE SET count = agent_usage.count + 1`,
);
await db.exec(
  `INSERT INTO agent_usage (ip, count) VALUES ('203.0.113.7', 1)
   ON CONFLICT (ip, day) DO UPDATE SET count = agent_usage.count + 1`,
);
check(
  "agent_usage upsert increments",
  (await one("SELECT count FROM agent_usage WHERE ip='203.0.113.7'")).count,
  (v) => v === 2,
);

await db.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
