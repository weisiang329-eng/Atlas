/**
 * /v1/industries/:id/drivers — what moves this industry, and whether the
 * claim survives contact with the data.
 *
 * The response deliberately pairs each CLAIM with its BACKTEST. Rendering the
 * claim alone would produce a page of confident sentences with no way to tell
 * the checked ones from the guesses — which is the failure mode
 * docs/INDUSTRY-INTELLIGENCE.md §5 exists to prevent: "a driver whose stated
 * relationship never held is a driver to remove, not to keep."
 */
import { Hono } from "hono";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Env } from "../index.ts";
import { createDb, getPeriodsWithFacts, listCompanies, listIndustries } from "../db/repo.ts";
import { industryDriver, industryMetric } from "../db/schema.ts";
import {
  backtestDrivers,
  industryNetMargin,
  scanLags,
  toQuarterly,
  type BacktestResult,
  type DriverClaim,
} from "../domain/drivers.ts";
import { rollUpMembers } from "../domain/taxonomy.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const drivers = new Hono<AppEnv>();

/**
 * The claim states gross margin; the Bursa quarterlies carry revenue and net
 * income only. Testing against net margin is the honest best available, and
 * saying so is the difference between a proxy and a substitution.
 */
const PROXY_NOTE =
  "Claim is about gross margin; these filers report revenue and net income only, so the test runs on revenue-weighted NET margin.";

drivers.get("/:id/drivers", async (c) => {
  const db = c.get("db");
  const industryId = c.req.param("id");

  const [claims, industries, companies] = await Promise.all([
    db
      .select()
      .from(industryDriver)
      .where(eq(industryDriver.industryId, industryId))
      .orderBy(asc(industryDriver.phase), asc(industryDriver.key)),
    listIndustries(db),
    listCompanies(db),
  ]);

  if (claims.length === 0) {
    // Not an error: most leaves have no drivers yet, and the empty state is
    // itself the work list.
    return c.json({ industryId, drivers: [], target: null });
  }

  // The target: this industry's own margin history, rolled up over the tree so
  // a parent node is tested against the companies beneath it.
  const memberIds = new Set(rollUpMembers(industries, companies).get(industryId) ?? []);
  const periods = (
    await Promise.all(
      [...memberIds].map((id) => getPeriodsWithFacts(db, id, "quarter")),
    )
  ).flat();

  const target = industryNetMargin(
    periods.map((p) => ({ reportDate: p.period.reportDate, facts: p.facts })),
  );

  const seriesKeys = claims
    .map((d) => d.seriesKey)
    .filter((k): k is string => Boolean(k));

  const metricRows =
    seriesKeys.length === 0
      ? []
      : await db
          .select()
          .from(industryMetric)
          .where(
            and(
              eq(industryMetric.industryId, industryId),
              inArray(industryMetric.metricKey, seriesKeys),
            ),
          )
          .orderBy(asc(industryMetric.observationDate));

  const pointsByKey = new Map<string, { date: string; value: number }[]>();
  for (const row of metricRows) {
    const list = pointsByKey.get(row.metricKey) ?? [];
    list.push({ date: row.observationDate, value: row.value });
    pointsByKey.set(row.metricKey, list);
  }

  // One joint model over every driver that has a series, each at its own lag,
  // so each coefficient is a partial effect. Tested separately, the glove
  // drivers report that rising feedstock RAISES margin — the pandemic ASP
  // spike leaking into whatever else moved with it.
  const backtestInput = {
    drivers: claims
      .filter((d) => d.seriesKey && (pointsByKey.get(d.seriesKey)?.length ?? 0) > 0)
      .map((d) => ({
        key: d.key,
        observations: toQuarterly(pointsByKey.get(d.seriesKey!)!),
        lagQuarters: d.lagQuarters,
        direction: d.direction,
      })),
    target,
    targetMetric: "net_margin_pct",
    // Every seeded glove claim is about gross margin; the filers report net.
    isProxy: claims.some((d) => d.targetMetric !== "net_margin_pct"),
    proxyNote: claims.some((d) => d.targetMetric !== "net_margin_pct")
      ? PROXY_NOTE
      : null,
  };

  const backtests = backtestDrivers(backtestInput);

  const untested: BacktestResult = {
    verdict: "insufficient-data",
    n: 0,
    testedAgainst: null,
    isProxy: false,
    proxyNote: null,
    impliedElasticity: null,
    r2: null,
    signMatchesClaim: null,
    controlledFor: [],
    sampleFrom: null,
    sampleTo: null,
  };

  const results = claims.map((claim) => {
    const hasSeries = Boolean(
      claim.seriesKey && (pointsByKey.get(claim.seriesKey)?.length ?? 0) > 0,
    );
    return {
      ...(claim as unknown as DriverClaim),
      /** Present so the UI can say WHY a driver was never tested. */
      hasSeries,
      backtest: backtests.get(claim.key) ?? untested,
      /**
       * Diagnostic, not a verdict — see scanLags. Exposed because "the sign
       * flips between lag 1 and lag 2" is the honest answer to "is our stated
       * lag right?", and hiding it would leave a claim looking settled.
       */
      lagProfile: hasSeries ? scanLags(backtestInput, claim.key) : [],
    };
  });

  return c.json({
    industryId,
    /** The series every claim was tested against, so a reader can check it. */
    target: {
      metric: "net_margin_pct",
      label: "Revenue-weighted net margin",
      unit: "%",
      points: target,
      companies: [...memberIds].sort(),
    },
    drivers: results,
  });
});
