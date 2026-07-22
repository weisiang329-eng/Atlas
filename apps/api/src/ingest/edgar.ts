/**
 * EDGAR quarterly ingestion (P022 v2), run from the Worker.
 *
 * Annual figures ship as a checked-in seed, which works because there are ~100
 * of them. Quarterly is 400+ periods and 8,000+ facts — a 3.4 MB SQL file that
 * cannot be bundled into a Worker. More importantly it should not be: quarters
 * arrive every 90 days, so they want a pull, not a redeploy.
 *
 * SEC fair-access policy is enforced by IP BAN rather than by 429, so every
 * request goes through `politeFetch("sec-edgar", …)`, which spaces calls at
 * 150 ms (~6.7 req/s, deliberately under the published 10/s) and sends the
 * declared User-Agent the policy requires.
 */
import type { Sql } from "postgres";
import {
  EDGAR_COMPANIES,
  TAG_MAP,
  DURATION_CONCEPTS,
  NON_ADDITIVE_CONCEPTS,
} from "./edgar-tags.ts";
import {
  extractAnnualRevenue,
  extractQuarters,
  reconcileQuarters,
  type GaapFacts,
} from "./edgar-quarters.ts";
import { politeFetch } from "./sources.ts";

/** The policy requires a real contact; SEC bans anonymous bulk callers. */
const UA = "Atlas Research (weisiang329-eng/Atlas) hello@houzscentury.com";

export interface EdgarIngestResult {
  company: string;
  quarters: number;
  facts: number;
  range: string | null;
  /** Fiscal years whose quarters failed to reconcile and were skipped. */
  droppedYears?: number[];
  /** Previously-ingested quarters this source no longer produces, removed. */
  retractedPeriods?: number;
  error?: string;
}

/**
 * Fetch one company's quarters and upsert them.
 *
 * Upserts use the same natural keys as the seed generator —
 * (company_id, period_label) and (period_id, concept) — so an ingest run and a
 * seed replay converge on the same rows instead of duplicating them.
 */
async function ingestCompany(
  sql: Sql,
  c: (typeof EDGAR_COMPANIES)[number],
): Promise<EdgarIngestResult> {
  const cik = String(c.cik).padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

  const res = await politeFetch("sec-edgar", url, {
    headers: { "user-agent": UA, accept: "application/json" },
  });
  if (!res.ok) {
    return { company: c.id, quarters: 0, facts: 0, range: null, error: `HTTP ${res.status}` };
  }
  const body = (await res.json()) as { entityName?: string; facts?: { "us-gaap"?: GaapFacts } };
  const gaap = body.facts?.["us-gaap"] ?? {};
  const raw = extractQuarters(gaap, c, TAG_MAP, DURATION_CONCEPTS, NON_ADDITIVE_CONCEPTS);
  // Quarters that contradict the audited annual figure are not ingested.
  const annual = extractAnnualRevenue(gaap, c, TAG_MAP);
  const { quarters, dropped } = reconcileQuarters(annual, raw);

  const keys = Object.keys(quarters).sort();
  if (keys.length === 0) {
    return { company: c.id, quarters: 0, facts: 0, range: null, error: "no quarters derived" };
  }

  const sourceId = `sec-edgar-${c.id}`;
  const retrievedAt = new Date().toISOString().slice(0, 10);
  await sql`
    INSERT INTO source (id, kind, name, url, retrieved_at, note)
    VALUES (${sourceId}, 'sec-edgar', ${`SEC EDGAR companyfacts — ${body.entityName ?? c.id}`},
            ${url}, ${retrievedAt},
            ${"Quarterly 10-Q/10-K datapoints. Flow figures are the reported 3-month value where published, otherwise derived by year-to-date differencing; quarters that cannot be derived are omitted."})
    ON CONFLICT (id) DO UPDATE SET retrieved_at = excluded.retrieved_at, note = excluded.note
  `;

  /*
   * Retract quarters this source no longer produces.
   *
   * Same failure mode as stale facts, one level up: when Vertiv's SPAC-shell
   * quarters were dropped from extraction, no period row was written for them
   * and the previously-ingested rows simply stayed, still serving revenue of
   * zero. Anything this source owns that is not in today's key set goes.
   */
  const labels = keys.map((k) => {
    const [fyS, qS] = k.split("Q");
    return `Q${Number(qS)} FY${String(Number(fyS)).slice(2)}`;
  });
  /*
   * Retract quarters this source no longer produces.
   *
   * Same failure mode as a stale fact, one level up: when Vertiv's SPAC-shell
   * quarters were dropped from extraction, no period row was written for them,
   * so the previously-ingested rows stayed and kept serving revenue of zero.
   *
   * The diff is done in JS and the deletes issued by id, deliberately. Both
   * `<> ALL(${labels})` and `NOT IN ${sql(labels)}` rendered the array as a
   * comma-joined string and Postgres rejected it as a malformed array literal
   * — and the first version of this failed SILENTLY, which is worse. Stale
   * rows are normally zero, so the loop costs nothing.
   */
  const wanted = new Set(
    keys.map((k) => {
      const [fyS, qS] = k.split("Q");
      return `Q${Number(qS)} FY${String(Number(fyS)).slice(2)}`;
    }),
  );
  const existing = await sql<{ id: number; period_label: string }[]>`
    SELECT id, period_label FROM financial_period
    WHERE company_id = ${c.id} AND period_type = 'quarter' AND source_id = ${sourceId}
  `;
  let retracted = 0;
  for (const row of existing) {
    if (wanted.has(row.period_label)) continue;
    await sql`DELETE FROM financial_period WHERE id = ${row.id}`;
    retracted += 1;
  }

  let facts = 0;
  for (const key of keys) {
    const [fyStr, qStr] = key.split("Q");
    const fy = Number(fyStr);
    const qtr = Number(qStr);
    const label = `Q${qtr} FY${String(fy).slice(2)}`;

    const rows = await sql<{ id: number }[]>`
      INSERT INTO financial_period
        (company_id, period_label, period_type, fiscal_year, fiscal_quarter, currency, unit, source_id)
      VALUES (${c.id}, ${label}, 'quarter', ${fy}, ${qtr}, 'USD', 'USD millions', ${sourceId})
      ON CONFLICT (company_id, period_label) DO UPDATE
        SET source_id = excluded.source_id,
            fiscal_year = excluded.fiscal_year,
            fiscal_quarter = excluded.fiscal_quarter
      RETURNING id
    `;
    const periodId = rows[0]?.id;
    if (periodId === undefined) continue;

    /*
     * Clear this source's facts for the period before writing.
     *
     * Upserting alone cannot retract a value that becomes ABSENT rather than
     * different, and that is exactly what the share-count fix produced: an
     * earlier run had written DilutedShares = −28 for NVIDIA Q4 FY26 (a
     * differenced weighted average), the corrected run simply stopped emitting
     * the concept, and the poisoned row survived to render EPS of −1,534.29.
     *
     * Scoped to this source_id, so manually-seeded facts EDGAR does not map
     * are untouched — the same boundary the seed generator respects.
     */
    await sql`
      DELETE FROM financial_fact
      WHERE period_id = ${periodId} AND source_id = ${sourceId}
    `;

    for (const [concept, value] of Object.entries(quarters[key] ?? {})) {
      await sql`
        INSERT INTO financial_fact (period_id, concept, value, source_id)
        VALUES (${periodId}, ${concept}, ${value}, ${sourceId})
        ON CONFLICT (period_id, concept) DO UPDATE
          SET value = excluded.value, source_id = excluded.source_id
      `;
      facts += 1;
    }
  }

  return {
    company: c.id,
    quarters: keys.length,
    facts,
    range: `${keys[0]} – ${keys[keys.length - 1]}`,
    // Reported rather than silently swallowed — a year disappearing from the
    // quarterly view should be visible, not a mystery.
    ...(dropped.length ? { droppedYears: dropped.map((d) => d.fy) } : {}),
    ...(retracted ? { retractedPeriods: retracted } : {}),
  };
}

/**
 * Ingest the whole roster, or a single company when `only` is given.
 *
 * Failures are captured per company rather than thrown: one delisted CIK or
 * one SEC hiccup must not discard the six companies that succeeded.
 */
export async function ingestEdgarQuarters(
  sql: Sql,
  only?: string,
): Promise<EdgarIngestResult[]> {
  const roster = only ? EDGAR_COMPANIES.filter((c) => c.id === only) : EDGAR_COMPANIES;
  const out: EdgarIngestResult[] = [];
  for (const c of roster) {
    try {
      out.push(await ingestCompany(sql, c));
    } catch (e) {
      out.push({
        company: c.id,
        quarters: 0,
        facts: 0,
        range: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return out;
}
