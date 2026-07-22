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
  type Observation,
} from "../domain/drivers.ts";
import { DERIVATION_BY_KEY, deriveSeries, type Derivation } from "../domain/derived-series.ts";
import { placePeriod } from "../domain/fiscal.ts";
import { descendantIds, pathOf, rollUpMembers } from "../domain/taxonomy.ts";

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

  const [industries, companies] = await Promise.all([
    listIndustries(db),
    listCompanies(db),
  ]);

  /*
   * Drivers roll DOWN as well as up. They hang off the leaf whose drivers they
   * are — HBM's CoWoS constraint is not DRAM's inventory cycle, which is why
   * those nodes are split at all — but the companies sit on 存储, and that is
   * the page a reader opens. Showing only a node's own drivers would hide the
   * entire model one level below where anyone looks.
   */
  const scope = descendantIds(industries, industryId);
  const claims = await db
    .select()
    .from(industryDriver)
    .where(inArray(industryDriver.industryId, [...scope]))
    .orderBy(asc(industryDriver.industryId), asc(industryDriver.phase), asc(industryDriver.key));

  const nodeById = new Map(industries.map((i) => [i.id, i]));

  if (claims.length === 0) {
    // Not an error: most leaves have no drivers yet, and the empty state is
    // itself the work list.
    return c.json({ industryId, drivers: [], target: null });
  }

  const membersByNode = rollUpMembers(industries, companies);

  const fyEndByCompany = new Map(
    companies.map((co) => [co.id, co.fiscalYearEndMonth ?? null]),
  );

  /**
   * The nearest node at or above `nodeId` that any company is filed under.
   *
   * Drivers hang off driver-homogeneous leaves while companies sit higher —
   * Micron and SK hynix are filed on 存储, and DRAM/NAND/HBM hold no members
   * at all. Without this every memory driver would be tested against an empty
   * target forever, and the reason would look like missing data rather than a
   * modelling choice. The node actually used is reported, not assumed.
   */
  const nearestNodeWithMembers = (nodeId: string): string | null => {
    for (const node of [...pathOf(industries, nodeId)].reverse()) {
      if ((membersByNode.get(node.id) ?? []).length > 0) return node.id;
    }
    return null;
  };

  /** Periods for a set of companies, with their fiscal calendars attached. */
  const derivationInputs = async (companyIds: string[]) =>
    Promise.all(
      companyIds.map(async (id) => ({
        companyId: id,
        fiscalYearEndMonth: fyEndByCompany.get(id) ?? null,
        periods: (await getPeriodsWithFacts(db, id, "quarter")).map((p) => ({
          reportDate: p.period.reportDate,
          fiscalYear: p.period.fiscalYear,
          fiscalQuarter: p.period.fiscalQuarter,
          facts: p.facts,
        })),
      })),
    );

  /**
   * One node's margin history: its members', rolled up over the tree.
   *
   * Each period is placed on the calendar before aggregation. Most US
   * quarterly periods carry no filed date (the EDGAR seed never wrote one),
   * so they are placed through the company's fiscal calendar instead —
   * derivation, reported as such, never a fabricated date.
   */
  const marginFor = async (nodeId: string) => {
    const memberIds = membersByNode.get(nodeId) ?? [];
    const perCompany = await Promise.all(
      memberIds.map(async (id) => ({
        id,
        periods: await getPeriodsWithFacts(db, id, "quarter"),
      })),
    );

    let derivedCount = 0;
    let unplaced = 0;
    const placed = perCompany.flatMap(({ id, periods }) =>
      periods.map((p) => {
        const placement = placePeriod(
          {
            reportDate: p.period.reportDate,
            fiscalYear: p.period.fiscalYear,
            fiscalQuarter: p.period.fiscalQuarter,
          },
          fyEndByCompany.get(id) ?? null,
        );
        if (placement.derived) derivedCount += 1;
        if (!placement.quarter) unplaced += 1;
        return { quarter: placement.quarter, facts: p.facts };
      }),
    );

    return { memberIds, points: industryNetMargin(placed), derivedCount, unplaced };
  };

  /**
   * Walk UP until a node actually has a margin history.
   *
   * Membership alone is not enough: ASML is filed under 半导体设备, so that
   * node "has members" — but Atlas holds no ASML quarterlies, so its margin
   * history is empty and every equipment driver would report insufficient data
   * with a series sitting right there. The borrow is recorded, because
   * "DRAM's margin" and "存储's margin standing in for DRAM" are different
   * claims and only one of them is true.
   */
  const targetFor = async (requestedNodeId: string) => {
    const chain = [...pathOf(industries, requestedNodeId)].reverse();
    let fallback: Awaited<ReturnType<typeof marginFor>> | null = null;

    for (const node of chain) {
      const margin = await marginFor(node.id);
      fallback ??= margin;
      if (margin.points.length > 0) {
        return {
          ...margin,
          fromNodeId: node.id,
          borrowed: node.id !== requestedNodeId,
        };
      }
    }

    return {
      ...(fallback ?? { memberIds: [], points: [], derivedCount: 0, unplaced: 0 }),
      fromNodeId: requestedNodeId,
      borrowed: false,
    };
  };

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
              inArray(industryMetric.industryId, [...scope]),
              inArray(industryMetric.metricKey, seriesKeys),
            ),
          )
          .orderBy(asc(industryMetric.observationDate));

  // Keyed by node + series: two nodes may both track "utilisation" and they
  // are not the same series.
  const pointsByKey = new Map<string, { date: string; value: number }[]>();
  for (const row of metricRows) {
    const k = `${row.industryId}::${row.metricKey}`;
    const list = pointsByKey.get(k) ?? [];
    list.push({ date: row.observationDate, value: row.value });
    pointsByKey.set(k, list);
  }
  const pointsFor = (d: { industryId: string; seriesKey: string | null }) =>
    d.seriesKey ? pointsByKey.get(`${d.industryId}::${d.seriesKey}`) : undefined;

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

  /*
   * One joint model PER NODE. Drivers are only controls for each other when
   * they act on the same target: holding DRAM's inventory cycle fixed says
   * nothing about HBM's margin, and pooling them would invent a control that
   * does not exist.
   */
  const byNode = new Map<string, typeof claims>();
  for (const claim of claims) {
    const list = byNode.get(claim.industryId) ?? [];
    list.push(claim);
    byNode.set(claim.industryId, list);
  }

  /**
   * A driver's series, from wherever it honestly comes from.
   *
   * Ingested rows win; a derivation from stored filings is the fallback. The
   * origin is returned with it because "computed from Micron's and SK hynix's
   * balance sheets" and "MARGMA's published ASP" are different kinds of
   * number and the page must not present them identically.
   */
  const seriesFor = async (
    claim: { industryId: string; seriesKey: string | null },
  ): Promise<{ observations: Observation[]; origin: string; derivation: Derivation | null; companies: string[] }> => {
    const ingested = pointsFor(claim);
    if (ingested && ingested.length > 0) {
      return { observations: toQuarterly(ingested), origin: "ingested", derivation: null, companies: [] };
    }
    const derivation = claim.seriesKey ? DERIVATION_BY_KEY.get(claim.seriesKey) : undefined;
    if (!derivation) {
      return { observations: [], origin: "none", derivation: null, companies: [] };
    }
    const companyIds =
      derivation.companies === "members"
        ? membersByNode.get(nearestNodeWithMembers(claim.industryId) ?? "") ?? []
        : derivation.companies.filter((id) => fyEndByCompany.has(id));
    if (companyIds.length === 0) {
      return { observations: [], origin: "none", derivation, companies: [] };
    }
    return {
      observations: deriveSeries(derivation, await derivationInputs(companyIds)),
      origin: "derived",
      derivation,
      companies: companyIds,
    };
  };

  const results: unknown[] = [];
  for (const [nodeId, nodeClaims] of byNode) {
    const targetInfo = await targetFor(nodeId);
    const target = targetInfo.points;
    const isProxy = nodeClaims.some((d) => d.targetMetric !== "net_margin_pct");

    const seriesByKey = new Map<string, Awaited<ReturnType<typeof seriesFor>>>();
    for (const d of nodeClaims) seriesByKey.set(d.key, await seriesFor(d));

    const backtestInput = {
      drivers: nodeClaims
        .filter((d) => (seriesByKey.get(d.key)?.observations.length ?? 0) > 0)
        .map((d) => ({
          key: d.key,
          observations: seriesByKey.get(d.key)!.observations,
          lagQuarters: d.lagQuarters,
          direction: d.direction,
        })),
      target,
      targetMetric: "net_margin_pct",
      isProxy,
      proxyNote: isProxy ? PROXY_NOTE : null,
    };
    const backtests = backtestDrivers(backtestInput);
    const node = nodeById.get(nodeId);

    for (const claim of nodeClaims) {
      const series = seriesByKey.get(claim.key)!;
      const hasSeries = series.observations.length > 0;
      results.push({
        ...(claim as unknown as DriverClaim),
        /** Which node this driver hangs off — it may be below the one asked for. */
        nodeId,
        nodeName: node?.name ?? nodeId,
        nodeNameZh: node?.nameZh ?? null,
        inherited: nodeId !== industryId,
        /** Present so the UI can say WHY a driver was never tested. */
        hasSeries,
        /** `ingested` · `derived` · `none` — not the same kind of number. */
        seriesOrigin: series.origin,
        /** For a derivation: what it actually measures, and from whose books. */
        derivedMeasures: series.derivation?.measures ?? null,
        derivedFromCompanies: series.companies,
        derivedUnit: series.derivation?.unit ?? null,
        backtest: backtests.get(claim.key) ?? untested,
        /**
         * Diagnostic, not a verdict — see scanLags. Exposed because "the sign
         * flips between lag 1 and lag 2" is the honest answer to "is our stated
         * lag right?", and hiding it would leave a claim looking settled.
         */
        lagProfile: hasSeries ? scanLags(backtestInput, claim.key) : [],
      });
    }
  }

  const own = await targetFor(industryId);

  return c.json({
    industryId,
    /** The series claims on THIS node were tested against. */
    target: {
      metric: "net_margin_pct",
      label: "Revenue-weighted net margin",
      unit: "%",
      points: own.points,
      companies: [...own.memberIds].sort(),
      /**
       * How the quarters were placed. `derivedQuarters` counts periods with no
       * filed date, aligned through their fiscal calendar; `unplacedPeriods`
       * counts those Atlas could not place at all and therefore dropped.
       * Both are on the wire because a margin history is only as trustworthy
       * as its alignment.
       */
      derivedQuarters: own.derivedCount,
      unplacedPeriods: own.unplaced,
      /**
       * Which node the margin history came from. A leaf with no companies
       * filed on it borrows its parent's — stated, because "DRAM's margin"
       * and "存储's margin, standing in for DRAM" are different claims.
       */
      fromNodeId: own.fromNodeId,
      fromNodeName: nodeById.get(own.fromNodeId)?.nameZh ?? own.fromNodeId,
      borrowed: own.borrowed,
    },
    drivers: results,
  });
});
