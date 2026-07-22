/**
 * EDGAR refresh — the network step (run locally, never in CI).
 *
 * For each roster company, fetches SEC companyfacts, attributes datapoints
 * to fiscal years, resolves the tag map, and writes compact facts.json
 * (checked in). generate.mjs turns that into SQL offline.
 *
 *   node seed/edgar/refresh.mjs
 *
 * SEC fair-access policy: identify with a User-Agent and stay well under
 * 10 req/s — we make one request per company with a 300 ms gap.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CASH_ADDONS,
  DURATION_CONCEPTS,
  EDGAR_COMPANIES,
  GOODWILL_PARTS,
  NON_ADDITIVE_CONCEPTS,
  TAG_MAP,
} from "./companies.mjs";
import { extractQuarters, reconcileQuarters } from "./quarters.mjs";

const UA = "Atlas Research (weisiang329-eng/Atlas) hello@houzscentury.com";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const monthDiff = (m1, m2) => Math.min(Math.abs(m1 - m2), 12 - Math.abs(m1 - m2));
const days = (a, b) => (new Date(b) - new Date(a)) / 86_400_000;

/**
 * Attribute a datapoint to a fiscal year: end month within ±1 of the
 * company's FY-end month; duration entries must span a full year.
 * Returns the label year (= end date's calendar year) or null.
 */
function fiscalYearOf(entry, fyEndMonth, isDuration) {
  if (!entry.end) return null;
  const end = new Date(entry.end);
  if (monthDiff(end.getUTCMonth() + 1, fyEndMonth) > 1) return null;
  if (isDuration) {
    if (!entry.start) return null;
    const span = days(entry.start, entry.end);
    if (span < 330 || span > 380) return null;
  }
  return end.getUTCFullYear();
}

/** Latest-filed entry wins; tie-break on later end date. */
function better(a, b) {
  if (!a) return b;
  if (a.filed !== b.filed) return a.filed > b.filed ? a : b;
  return a.end >= b.end ? a : b;
}

function extractTag(units, fyEndMonth, isDuration) {
  const series = units?.USD ?? units?.shares ?? null;
  if (!series) return {};
  const byYear = {};
  for (const e of series) {
    if (e.form !== "10-K") continue;
    const fy = fiscalYearOf(e, fyEndMonth, isDuration);
    if (fy === null) continue;
    byYear[fy] = better(byYear[fy], e);
  }
  return byYear;
}

async function fetchCompany(c) {
  const cik = String(c.cik).padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "application/json" } });
  if (!res.ok) throw new Error(`${c.id}: HTTP ${res.status}`);
  const body = await res.json();
  const gaap = body.facts?.["us-gaap"] ?? {};

  const perYear = {}; // fy -> { concept -> value(millions) }
  const put = (fy, concept, val) => {
    (perYear[fy] ??= {})[concept] = Number((val / 1e6).toFixed(3));
  };

  for (const [concept, tags] of Object.entries(TAG_MAP)) {
    const isDuration = DURATION_CONCEPTS.has(concept);
    for (const tag of tags) {
      const byYear = extractTag(gaap[tag]?.units, c.fyEndMonth, isDuration);
      for (const [fy, e] of Object.entries(byYear)) {
        // First tag that produced a year wins; later fallbacks only fill gaps.
        if (perYear[fy]?.[concept] === undefined) put(fy, concept, e.val);
      }
    }
  }
  // Cash add-ons and goodwill parts are summed onto their concepts.
  for (const tag of CASH_ADDONS) {
    const byYear = extractTag(gaap[tag]?.units, c.fyEndMonth, false);
    for (const [fy, e] of Object.entries(byYear)) {
      if (perYear[fy]?.CashAndEquivalents !== undefined) {
        perYear[fy].CashAndEquivalents = Number(
          (perYear[fy].CashAndEquivalents + e.val / 1e6).toFixed(3),
        );
      }
    }
  }
  const goodwillByYear = {};
  for (const tag of GOODWILL_PARTS) {
    const byYear = extractTag(gaap[tag]?.units, c.fyEndMonth, false);
    for (const [fy, e] of Object.entries(byYear)) {
      goodwillByYear[fy] = (goodwillByYear[fy] ?? 0) + e.val / 1e6;
    }
  }
  for (const [fy, v] of Object.entries(goodwillByYear)) {
    if (perYear[fy]) perYear[fy].GoodwillIntangibles = Number(v.toFixed(3));
  }

  // Sanity: drop skeleton years (no revenue and no total assets — usually
  // off-cycle stubs or transition periods).
  for (const fy of Object.keys(perYear)) {
    const y = perYear[fy];
    if (y.Revenue === undefined && y.TotalAssets === undefined) delete perYear[fy];
  }

  // Quarterly lives in its own module: the annual path is a straight
  // attribution, while quarters need YTD-differencing (see quarters.mjs).
  const rawQuarters = extractQuarters(gaap, c, TAG_MAP, DURATION_CONCEPTS, NON_ADDITIVE_CONCEPTS);
  // Quarters that contradict the audited annual figure are dropped, loudly.
  const { quarters, dropped } = reconcileQuarters(perYear, rawQuarters);
  for (const d of dropped) {
    console.log(
      `  ! ${c.id} FY${d.fy}: quarters sum ${d.sum.toFixed(0)} vs annual ` +
        `${d.annual.toFixed(0)} — dropped`,
    );
  }

  return {
    id: c.id,
    cik: c.cik,
    url,
    entityName: body.entityName,
    years: perYear,
    quarters,
  };
}

const out = { provenance: null, companies: [] };
for (const c of EDGAR_COMPANIES) {
  process.stdout.write(`fetching ${c.id}... `);
  const r = await fetchCompany(c);
  const yrs = Object.keys(r.years).sort();
  const qs = Object.keys(r.quarters).sort();
  console.log(
    `${yrs.length} fiscal years (${yrs[0]} – ${yrs.at(-1)}), ` +
      `${qs.length} quarters` + (qs.length ? ` (${qs[0]} – ${qs.at(-1)})` : ""),
  );
  out.companies.push(r);
  await sleep(300);
}
out.provenance = `SEC EDGAR companyfacts API (data.sec.gov), retrieved ${new Date().toISOString().slice(0, 10)}. Annual 10-K and quarterly 10-Q/10-K datapoints; latest filing wins per (concept, period). Quarterly flow figures are the reported 3-month value where published, otherwise derived by year-to-date differencing; quarters that cannot be derived are omitted. Values in millions USD (shares in millions).`;

const path = join(dirname(fileURLToPath(import.meta.url)), "facts.json");
writeFileSync(path, JSON.stringify(out, null, 1));
console.log(`wrote ${path}`);
