/**
 * Verifies the driver model and its backtest.
 *
 * The point of this suite is that the backtest must be able to say NO. A
 * checker that confirms whatever it is given is worse than no checker, because
 * it launders guesses into knowledge — so the cases below deliberately include
 * a claim with the wrong sign, a sample too short to mean anything, and a
 * driver that never moved.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  MIN_SAMPLE,
  backtestDrivers,
  industryNetMargin,
  quarterOf,
  scanLags,
  shiftQuarter,
  toQuarterly,
} from "../src/domain/drivers.ts";

/** One driver, tested alone — the k=1 case of the joint model. */
const backtestOne = (o) =>
  backtestDrivers({
    drivers: [{ key: "d", observations: o.driver, lagQuarters: o.lagQuarters, direction: o.direction }],
    target: o.target,
    targetMetric: o.targetMetric,
    isProxy: o.isProxy,
    proxyNote: o.proxyNote,
  }).get("d");

/**
 * A driver series whose quarterly % moves VARY. A constant growth rate has
 * zero variance in changes, which identifies nothing — the first version of
 * these fixtures made that mistake and the engine correctly refused to answer.
 */
const wiggle = (start, moves) => {
  const out = [];
  let v = 100;
  moves.forEach((mv, i) => {
    v *= 1 + mv / 100;
    out.push({ quarter: shiftQuarter(start, i), value: Number(v.toFixed(4)) });
  });
  return out;
};

const MOVES = [0, 12, -6, 9, -3, 15, -8, 4, 11, -5, 7, -2, 13, -9, 6, 3, -4, 10];

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- quarter arithmetic (the join key across fiscal calendars) ---");
check("a date lands in its calendar quarter", quarterOf("2026-02-28"), "2026Q1");
check("December is Q4", quarterOf("2025-12-31"), "2025Q4");
check("an unparseable date yields nothing", quarterOf("not a date"), "");
check("shifting forward crosses the year", shiftQuarter("2025Q4", 1), "2026Q1");
check("shifting back crosses the year", shiftQuarter("2026Q1", -1), "2025Q4");
check("shifting by zero is identity", shiftQuarter("2026Q2", 0), "2026Q2");

console.log("\n--- weekly and monthly sources collapse to the claim's resolution ---");
{
  const q = toQuarterly([
    { date: "2026-01-05", value: 10 },
    { date: "2026-02-05", value: 20 },
    { date: "2026-04-05", value: 40 },
  ]);
  check("one observation per quarter", q.map((o) => o.quarter), ["2026Q1", "2026Q2"]);
  check("within-quarter points are averaged", q[0].value, 15);
}

console.log("\n--- the backtest recovers a relationship it is given ---");
{
  // Margin moves −0.2 points per 1% of driver, one quarter later.
  const driver = wiggle("2020Q1", MOVES);
  const target = driver.map((o, i) => ({
    quarter: shiftQuarter(o.quarter, 1),
    value: 40 - MOVES.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.2,
  }));

  const r = backtestOne({ driver, target, lagQuarters: 1, direction: -1, targetMetric: "net_margin_pct" });
  check("verdict", r.verdict, "holds");
  check("implied elasticity ≈ −2 pp per +10%", r.impliedElasticity, (v) => Math.abs(v + 2) < 0.05);
  check("a clean relationship fits perfectly", r.r2, (v) => v > 0.99);
  check("the sign matches the claim", r.signMatchesClaim, true);
  check("sample window is reported", [r.sampleFrom !== null, r.sampleTo !== null], [true, true]);
  check("with one driver nothing is controlled for", r.controlledFor, []);
}

console.log("\n--- and it says NO when the claim is wrong ---");
{
  const driver = wiggle("2020Q1", MOVES);
  const target = driver.map((o, i) => ({
    quarter: shiftQuarter(o.quarter, 1),
    value: 20 + MOVES.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.2, // rises WITH the cost
  }));
  const r = backtestOne({ driver, target, lagQuarters: 1, direction: -1, targetMetric: "net_margin_pct" });
  check("a wrong-signed claim is contradicted, not softened", r.verdict, "contradicted");
  check("the contradiction is quantified", r.impliedElasticity, (v) => v > 0);
}

console.log("\n--- and it refuses to answer when it cannot ---");
{
  const short = wiggle("2024Q1", MOVES.slice(0, 6));
  const r = backtestOne({ driver: short, target: short, lagQuarters: 0, direction: 1, targetMetric: "net_margin_pct" });
  check(`below ${MIN_SAMPLE} quarters there is no verdict`, r.verdict, "insufficient-data");
  check("and no number is reported", [r.impliedElasticity, r.r2], [null, null]);

  const flat = Array.from({ length: 18 }, (_, i) => ({ quarter: shiftQuarter("2020Q1", i), value: 100 }));
  const moving = Array.from({ length: 18 }, (_, i) => ({ quarter: shiftQuarter("2020Q1", i), value: 10 + i }));
  const f = backtestOne({ driver: flat, target: moving, lagQuarters: 0, direction: 1, targetMetric: "net_margin_pct" });
  check("a driver that never moved explains nothing", f.verdict, "insufficient-data");

  const constantRate = Array.from({ length: 18 }, (_, i) => ({ quarter: shiftQuarter("2020Q1", i), value: 100 * 1.1 ** i }));
  const c = backtestOne({ driver: constantRate, target: moving, lagQuarters: 0, direction: 1, targetMetric: "net_margin_pct" });
  check("a driver whose CHANGES never vary identifies nothing either", c.verdict, "insufficient-data");
}

console.log("\n--- the reason drivers are estimated jointly ---");
{
  /*
   * The trap that real glove data walked into: a boom where the price driver
   * dominates and the cost driver merely rose alongside it. Margin here is
   * driven ONLY by price (+0.3 pp per 1%) with cost genuinely hurting a
   * little (−0.05), but the two move together.
   */
  const priceMoves = MOVES;
  const costMoves = MOVES.map((m, i) => m * 0.8 + (i % 3) - 1); // correlated, not identical
  const price = wiggle("2020Q1", priceMoves);
  const cost = wiggle("2020Q1", costMoves);
  const target = price.map((o, i) => ({
    quarter: o.quarter,
    value:
      20 +
      priceMoves.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.3 -
      costMoves.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.05,
  }));

  const alone = backtestOne({ driver: cost, target, lagQuarters: 0, direction: -1, targetMetric: "net_margin_pct" });
  check("tested alone, the cost driver's sign INVERTS (the trap)", alone.impliedElasticity, (v) => v > 0);
  check("...and would be reported as contradicted", alone.verdict, "contradicted");

  const joint = backtestDrivers({
    drivers: [
      { key: "price", observations: price, lagQuarters: 0, direction: 1 },
      { key: "cost", observations: cost, lagQuarters: 0, direction: -1 },
    ],
    target,
    targetMetric: "net_margin_pct",
  });
  check("estimated jointly, the cost coefficient is negative again", joint.get("cost").impliedElasticity, (v) => v < 0);
  check("and its verdict flips to holds", joint.get("cost").verdict, "holds");
  check("the price driver is right either way", joint.get("price").verdict, "holds");
  check("each coefficient names what it holds fixed", joint.get("cost").controlledFor, ["price"]);
}

console.log("\n--- the lag profile is a diagnostic, and it finds a known lag ---");
{
  // Margin responds two quarters after the driver moves; the CLAIM says one.
  const driver = wiggle("2020Q1", MOVES);
  const target = driver.map((o, i) => ({
    quarter: shiftQuarter(o.quarter, 2),
    value: 30 - MOVES.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.15,
  }));
  const input = {
    drivers: [{ key: "d", observations: driver, lagQuarters: 1, direction: -1 }],
    target,
    targetMetric: "net_margin_pct",
  };

  const profile = scanLags(input, "d");
  check("one probe per candidate lag", profile.map((p) => p.lagQuarters), [0, 1, 2, 3, 4]);
  const best = profile.filter((p) => p.r2 !== null).sort((a, b) => b.r2 - a.r2)[0];
  check("the true lag has the best fit", best.lagQuarters, 2);
  check("and its coefficient carries the true sign", best.impliedElasticity, (v) => v < 0);
  // The claimed lag still governs the verdict — the scan never overrides it.
  check("the stated lag is what gets a verdict", backtestDrivers(input).get("d").n, (v) => v > 0);
}

console.log("\n--- a proxy target is labelled as one ---");
{
  const s = wiggle("2020Q1", MOVES);
  const t = s.map((o, i) => ({ quarter: o.quarter, value: 30 - MOVES.slice(0, i + 1).reduce((a, b) => a + b, 0) * 0.1 }));
  const r = backtestOne({
    driver: s, target: t, lagQuarters: 0, direction: -1,
    targetMetric: "net_margin_pct", isProxy: true, proxyNote: "gross not reported",
  });
  check("the proxy flag survives", [r.isProxy, r.proxyNote], [true, "gross not reported"]);
  check("and the metric actually tested is named", r.testedAgainst, "net_margin_pct");
}

console.log("\n--- industry margin is revenue-weighted, not an average of averages ---");
{
  const periods = [
    { reportDate: "2026-03-31", facts: { Revenue: 1000, NetIncome: 100 } }, // 10%
    { reportDate: "2026-03-31", facts: { Revenue: 100, NetIncome: -50 } },  // −50%
    { reportDate: "2026-06-30", facts: { Revenue: 500, NetIncome: 50 } },
    { reportDate: "2026-06-30", facts: { Revenue: 500 } },                  // incomplete
    { reportDate: null, facts: { Revenue: 900, NetIncome: 90 } },           // undated
  ];
  const m = industryNetMargin(periods);
  check("one point per quarter", m.map((o) => o.quarter), ["2026Q1", "2026Q2"]);
  // Weighted: (100 − 50) / 1100 = 4.545%. An unweighted mean would say −20%,
  // letting the smallest maker define the industry.
  check("the big maker dominates, as 'industry margin' means", m[0].value, (v) => Math.abs(v - 4.545) < 0.01);
  check("a period missing NetIncome is skipped, not zero-filled", m[1].value, 10);
  check("an undated period cannot be placed and is dropped", m.length, 2);
}

console.log("\n--- against the real glove data ---");
{
  const db = new PGlite();
  for (const m of [
    "drizzle/0000_init_postgres.sql",
    "drizzle/0007_industry_tree.sql",
    "drizzle/0008_industry_driver.sql",
  ]) await db.exec(read(m));
  await db.exec(read("drizzle/0008_industry_driver.sql")); // replay must be a no-op
  for (const s of ["seed/glove/glove-seed.sql", "seed/glove/industry-metrics.sql"]) {
    await db.exec(read(s));
  }

  const claims = (await db.query(
    `SELECT key, phase, lag_quarters AS lag, direction, series_key AS series, kind
     FROM industry_driver WHERE industry_id = 'rubber-gloves' ORDER BY key`,
  )).rows;
  check("four glove drivers seeded", claims.length, 4);
  check("idempotent replay did not duplicate", new Set(claims.map((c) => c.key)).size, 4);
  check("every claim starts as an assumption", claims.every((c) => c.kind === "assumption"), true);

  const periods = (await db.query(
    `SELECT p.report_date AS "reportDate",
            max(CASE WHEN f.concept = 'Revenue' THEN f.value END) AS revenue,
            max(CASE WHEN f.concept = 'NetIncome' THEN f.value END) AS net
     FROM financial_period p JOIN financial_fact f ON f.period_id = p.id
     WHERE p.period_type = 'quarter' GROUP BY p.id, p.report_date`,
  )).rows;
  const target = industryNetMargin(
    periods.map((r) => ({ reportDate: r.reportDate, facts: { Revenue: r.revenue, NetIncome: r.net } })),
  );
  check("the glove quarterlies produce a real margin history", target.length, (v) => v > 40);

  const seriesOf = async (key) =>
    toQuarterly((await db.query(
      "SELECT observation_date AS date, value FROM industry_metric WHERE metric_key = $1 ORDER BY observation_date",
      [key],
    )).rows);

  const withSeries = claims.filter((x) => x.series);
  const joint = backtestDrivers({
    drivers: await Promise.all(
      withSeries.map(async (c) => ({
        key: c.key,
        observations: await seriesOf(c.series),
        lagQuarters: c.lag,
        direction: c.direction,
      })),
    ),
    target,
    targetMetric: "net_margin_pct",
    isProxy: true,
  });

  for (const c of withSeries) {
    const r = joint.get(c.key);
    console.log(
      `  · ${c.key}: ${r.verdict} · n=${r.n} · ${r.impliedElasticity ?? "—"} pp per +10% (controlling for ${r.controlledFor.join(", ") || "nothing"}) · R²=${r.r2 ?? "—"} · ${r.sampleFrom}–${r.sampleTo}`,
    );
    check(`${c.key} was actually testable`, r.n, (v) => v >= MIN_SAMPLE);
    check(`${c.key} reports a verdict that is not a guess`, r.verdict, (v) => v !== "insufficient-data");
    check(`${c.key} states what it held fixed`, r.controlledFor.length, (v) => v === withSeries.length - 1);
  }

  // The two blocked drivers are the reason the EIA key matters; they must read
  // as untested rather than quietly vanish.
  check("drivers without a series are stored anyway", claims.filter((c) => !c.series).map((c) => c.key), ["natural_gas", "utilisation"]);

  // The finding this suite exists to keep visible: on the real sample the
  // latex claim does not survive, and its sign is not even stable across
  // lags. Asserting the INSTABILITY (not a particular verdict) keeps the test
  // honest — if better data later settles it, this is what should be revisited.
  const latexProfile = scanLags(
    {
      drivers: await Promise.all(
        withSeries.map(async (c) => ({
          key: c.key, observations: await seriesOf(c.series),
          lagQuarters: c.lag, direction: c.direction,
        })),
      ),
      target,
      targetMetric: "net_margin_pct",
    },
    "nbr_latex",
  );
  console.log(
    "  · nbr_latex lag profile: " +
      latexProfile.map((p) => `lag${p.lagQuarters}=${p.impliedElasticity ?? "—"}`).join(" "),
  );
  const signs = new Set(
    latexProfile.filter((p) => p.impliedElasticity !== null).map((p) => Math.sign(p.impliedElasticity)),
  );
  check("the latex coefficient's sign is NOT stable across lags — the lag is unresolved", signs.size, 2);

  await db.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
