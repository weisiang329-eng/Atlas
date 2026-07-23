/**
 * Verifies cross-sectional percentile ranking (P010 v2).
 *
 * The properties that matter are the honest ones: a company with no score for
 * a factor must not be ranked for it AND must not pad anyone else's
 * denominator, ties must not be broken arbitrarily, and the peer count must
 * always travel with the percentile so a "90th" over 5 names is never mistaken
 * for a market percentile.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { Hono } from "hono";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  computePercentiles,
  percentileRank,
} from "../src/domain/percentile.ts";
import { scores } from "../src/routes/scores.ts";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- mid-rank percentile ---");
{
  const pop = [10, 20, 30, 40, 50];
  check("the max is the 90th, not the 100th (mid-rank)", percentileRank(50, pop), 90);
  check("the min is the 10th", percentileRank(10, pop), 10);
  check("the median is the 50th", percentileRank(30, pop), 50);
  // Ties share the average rank rather than an arbitrary order deciding.
  check("ties get one percentile", percentileRank(20, [20, 20, 20, 20]), 50);
  check("an empty population yields null", percentileRank(5, []), null);
  check("a value below everything is 0th", percentileRank(1, pop), 0);
}

console.log("\n--- ranking a small universe ---");
{
  const entities = [
    { id: "a", composite: 90, factors: { profitability: 80, cash: 70 } },
    { id: "b", composite: 60, factors: { profitability: 60, cash: null } },
    { id: "c", composite: 30, factors: { profitability: 40, cash: 50 } },
    { id: "d", composite: null, factors: { profitability: null, cash: 90 } },
  ];
  const p = computePercentiles(entities);

  check("the top composite ranks highest", p.get("a").values.composite, (v) => v > p.get("b").values.composite);
  check("a company with no composite is not ranked for it", p.get("d").values.composite, null);
  // d has no composite, so it must not be counted in the composite denominator.
  check("the composite peer count excludes the unscored", p.get("a").peerCounts.composite, 3);

  // cash: a(70), c(50), d(90) are scored; b is not.
  check("a factor is ranked over only the companies that have it", p.get("d").values.cash, (v) => v === Math.max(p.get("a").values.cash, p.get("c").values.cash, p.get("d").values.cash));
  check("cash peer count is 3, not 4", p.get("a").peerCounts.cash, 3);
  check("a company missing THAT factor is null for it, ranked for others",
    [p.get("b").values.cash, p.get("b").values.profitability !== null],
    [null, true]);
}

console.log("\n--- against the real universe (the route) ---");
{
  const pg = new PGlite();
  for (const m of [
    "drizzle/0000_init_postgres.sql", "drizzle/0007_industry_tree.sql",
    "drizzle/0010_fiscal_year_end.sql",
  ]) await pg.exec(read(m));
  for (const s of ["seed/seed.sql", "seed/edgar/edgar-seed.sql", "seed/glove/glove-seed.sql"]) {
    await pg.exec(read(s));
  }

  const db = drizzle(pg);
  const app = new Hono();
  app.use("*", async (c, next) => { c.set("db", db); await next(); });
  app.route("/v1/scores", scores);

  const res = await app.request("/v1/scores");
  check("scores endpoint still 200", res.status, 200);
  const body = await res.json();

  // The absolute score is untouched — this is the additive guarantee.
  check("every row still has its absolute atlasScore", body.every((r) => "atlasScore" in r), true);
  check("and now a percentile block", body.every((r) => "percentile" in r), true);

  const scored = body.filter((r) => r.atlasScore !== null);
  const top = scored[0]; // sorted desc
  check("the top-scored company is at or near the top percentile",
    top.percentile.values.composite, (v) => v >= 90);
  check("percentiles run 0–100", scored.every((r) => {
    const v = r.percentile.values.composite;
    return v === null || (v >= 0 && v <= 100);
  }), true);
  // The honesty field: peer count is the number actually scored, not 17.
  check("the peer count is the scored universe, and it is stated",
    top.percentile.peerCounts.composite, (v) => v === scored.length);
  console.log(`  · ${scored.length} scored; top = ${top.name} (${top.atlasScore}, ${top.percentile.values.composite}th of ${top.percentile.peerCounts.composite})`);

  await pg.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
