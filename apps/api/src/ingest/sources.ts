/**
 * The data-source registry — one place that knows every external source, its
 * rate limit, its registration link, and whether Atlas can reach it.
 *
 * Two things live here that were previously scattered or absent:
 *
 * 1. RATE LIMITS, as data. Every provider publishes a limit and several of them
 *    enforce it by blocking, not by returning 429. SEC EDGAR is explicit: ten
 *    requests per second, and exceeding it gets the IP banned. A limit that
 *    lives in a comment gets violated; a limit that lives in the fetcher does
 *    not.
 *
 * 2. REGISTRATION STEPS, so the owner has one list rather than links scattered
 *    across chat. The console renders straight from here.
 */

export type SourceStatus =
  /** Free, no key, verified reachable from the Worker. */
  | "connected"
  /**
   * Free and no key, but only checked from a laptop — NOT yet probed from the
   * Worker. The distinction is not pedantry: Google News RSS answers a laptop
   * and returns 503 to Cloudflare Workers. Run /v1/ingest/probe after a deploy
   * to promote these to `connected`.
   */
  | "unverified"
  /** Free tier exists but needs a key the owner has not supplied yet. */
  | "awaiting-key"
  /**
   * Costs real money and is deliberately NOT bought. Kept in the registry
   * with the substitute named, so the decision survives and nobody re-opens
   * it as an unknown.
   */
  | "paid"
  /** Not an external source at all — computed from data Atlas already holds. */
  | "derived"
  /** Tried and rejected — kept so nobody re-adds it. */
  | "rejected";

export interface DataSource {
  id: string;
  name: string;
  /** What in Atlas depends on it. */
  serves: string;
  status: SourceStatus;
  /** Worker env var holding the key, when one is needed. */
  secretName?: string;
  /** Where the owner registers. */
  registerUrl?: string;
  /** Ordered steps to obtain the key. */
  steps?: string[];
  docsUrl?: string;
  /** Published limit, verbatim, so the config below can be audited against it. */
  publishedLimit: string;
  /** Minimum milliseconds between requests, derived from `publishedLimit`. */
  minIntervalMs: number;
  /** Why it was rejected, when it was. */
  rejectedReason?: string;
  /** Roughly what it costs, for `paid` — so the trade-off is on the record. */
  costNote?: string;
  /**
   * Source ids used INSTEAD of this one. A substitute is never the same
   * measurement — company inventory days is not channel inventory weeks — so
   * whatever consumes it must restate what it is now measuring.
   */
  substitutedBy?: string[];
  priority?: number;
}

export const DATA_SOURCES: DataSource[] = [
  {
    id: "bnm",
    name: "Bank Negara Malaysia",
    serves: "Trade-ledger FX anchor — central-bank middle rate + dealer spread",
    status: "connected",
    docsUrl: "https://apikijangportal.bnm.gov.my/",
    publishedLimit: "No published quota; a courtesy limit is applied",
    // Rates change once a day, so once a day is all that is ever needed.
    minIntervalMs: 1000,
  },
  {
    id: "yahoo-finance-rss",
    name: "Yahoo Finance RSS",
    serves: "News Research Analyst — ticker-scoped headlines",
    status: "connected",
    publishedLimit: "No published quota; a courtesy limit is applied",
    // ~1 req/s across a 10-ticker sweep is well inside anything reasonable.
    minIntervalMs: 1000,
  },
  {
    id: "sec-edgar",
    name: "SEC EDGAR",
    serves: "Company financials, filings and full-text search",
    status: "connected",
    docsUrl: "https://www.sec.gov/os/webmaster-faq#developers",
    // The one limit here that is enforced by BANNING rather than by 429.
    publishedLimit: "10 requests/second, and a declared User-Agent is required",
    // 150ms ≈ 6.7 req/s — deliberately under the ceiling, not at it.
    minIntervalMs: 150,
  },
  {
    id: "world-bank",
    name: "World Bank Open Data",
    serves: "Macro indicators feeding industry KPIs",
    status: "connected",
    docsUrl: "https://datahelpdesk.worldbank.org/knowledgebase/topics/125589",
    publishedLimit: "No published quota; a courtesy limit is applied",
    minIntervalMs: 500,
  },
  {
    id: "frankfurter",
    name: "Frankfurter (ECB rates)",
    serves: "FX cross-check against BNM",
    status: "connected",
    docsUrl: "https://frankfurter.dev/",
    publishedLimit: "No published quota; a courtesy limit is applied",
    minIntervalMs: 1000,
  },

  {
    id: "finnhub",
    name: "Finnhub",
    serves:
      "Live quotes — unlocks unrealised P&L in the ledger, valuation multiples in the Atlas Score, price alerts and candle charts",
    status: "awaiting-key",
    secretName: "FINNHUB_API_KEY",
    registerUrl: "https://finnhub.io/register",
    docsUrl: "https://finnhub.io/docs/api",
    publishedLimit: "60 API calls/minute on the free tier",
    // 60/min = one per second. Kept exactly at the published rate, no burst.
    minIntervalMs: 1000,
    priority: 1,
    steps: [
      "Open finnhub.io/register and sign up with email",
      "Confirm the email; the dashboard shows the API key immediately",
      "Copy the key (it looks like a long alphanumeric string)",
      "Run: wrangler secret put FINNHUB_API_KEY   (paste when prompted)",
      "Tell Atlas — the quote adapter and every feature behind it turn on",
    ],
  },
  {
    id: "fred",
    name: "FRED (St. Louis Fed)",
    serves: "Commodity and macro series for the industry KPI database",
    status: "awaiting-key",
    secretName: "FRED_API_KEY",
    registerUrl: "https://fredaccount.stlouisfed.org/apikeys",
    docsUrl: "https://fred.stlouisfed.org/docs/api/fred/",
    publishedLimit: "120 requests/minute",
    minIntervalMs: 500,
    priority: 2,
    steps: [
      "Create a free FRED account at fredaccount.stlouisfed.org",
      "Go to My Account → API Keys → Request API Key",
      "State the use: personal investment research",
      "Run: wrangler secret put FRED_API_KEY",
    ],
  },
  {
    id: "eia",
    name: "US Energy Information Administration",
    serves: "Energy prices — data-centre power, glove production cost",
    status: "awaiting-key",
    secretName: "EIA_API_KEY",
    registerUrl: "https://www.eia.gov/opendata/register.php",
    publishedLimit: "No published quota; a courtesy limit is applied",
    minIntervalMs: 500,
    priority: 3,
    steps: [
      "Register at eia.gov/opendata/register.php with an email",
      "The key arrives by email immediately",
      "Run: wrangler secret put EIA_API_KEY",
    ],
  },
  {
    id: "alphavantage",
    name: "Alpha Vantage",
    serves: "Backup quote source if Finnhub is unavailable",
    status: "awaiting-key",
    secretName: "ALPHAVANTAGE_API_KEY",
    registerUrl: "https://www.alphavantage.co/support/#api-key",
    publishedLimit: "25 requests/day and 5/minute on the free tier",
    // 12s spacing respects 5/min. The DAILY cap is the real constraint and is
    // enforced separately by the caller — spacing alone cannot express it.
    minIntervalMs: 12_000,
    priority: 4,
    steps: [
      "Fill the form at alphavantage.co/support/#api-key",
      "The key appears on screen",
      "Run: wrangler secret put ALPHAVANTAGE_API_KEY",
    ],
  },

  {
    id: "glove-tracker",
    name: "glove-tracker dumps (MARGMA ASP + NBR latex)",
    serves:
      "The only industry driver series Atlas holds today — imported once from the owner's glove-tracker migrations, not fetched live",
    status: "connected",
    docsUrl: "https://www.margma.com.my/",
    publishedLimit: "n/a — a one-off import, not a live feed",
    minIntervalMs: 0,
  },

  /* ── Free, verified from a laptop, not yet probed from the Worker ─────── */
  {
    id: "twse-monthly-revenue",
    name: "TWSE open data — monthly revenue (t187ap05_L)",
    serves:
      "Foundry, advanced packaging and AI-server demand: every Taiwan-listed company files revenue MONTHLY, ~10 days after month end. TSMC, UMC, ASE, Quanta, Wistron in one free JSON feed — the highest-frequency read on the AI hardware chain that exists without paying for it.",
    status: "unverified",
    docsUrl: "https://openapi.twse.com.tw/",
    publishedLimit: "No published quota; a courtesy limit is applied",
    minIntervalMs: 1000,
    priority: 1,
  },
  {
    id: "sia-monthly-sales",
    name: "SIA / WSTS monthly semiconductor sales",
    serves: "Industry-wide billings — the denominator for share and cycle",
    status: "unverified",
    docsUrl: "https://www.semiconductors.org/",
    publishedLimit: "Press releases, not an API — HTML parsing required",
    minIntervalMs: 2000,
  },

  /* ── Free but needs a (free) key ──────────────────────────────────────── */
  {
    id: "census-m3",
    name: "US Census M3 — manufacturers' shipments, inventories & orders",
    serves:
      "Semiconductor (NAICS 3344) inventories, shipments and new orders — the free stand-in for channel inventory, and the only public inventories-to-shipments ratio for the sector",
    status: "awaiting-key",
    secretName: "CENSUS_API_KEY",
    registerUrl: "https://api.census.gov/data/key_signup.html",
    docsUrl: "https://www.census.gov/data/developers/data-sets/economic-indicators.html",
    publishedLimit: "500 requests/day without a key; unlimited with one (free)",
    minIntervalMs: 500,
    priority: 4,
    steps: [
      "Request a key at api.census.gov/data/key_signup.html (name + email)",
      "The key arrives by email within minutes",
      "Run: wrangler secret put CENSUS_API_KEY",
    ],
  },

  /* ── Not a source: computed from what Atlas already stores ────────────── */
  {
    id: "derived-filings",
    name: "Derived from stored filings",
    serves:
      "Inventory days, capex, and every other driver computable from financial_fact — no external source, no key, no cost. Needs code, not permission.",
    status: "derived",
    publishedLimit: "n/a — local computation",
    minIntervalMs: 0,
  },

  /* ── Paid, and deliberately not bought ────────────────────────────────── */
  {
    id: "trendforce",
    name: "TrendForce / DRAMeXchange",
    serves: "(would serve) DRAM & NAND contract and spot prices, HBM pricing",
    status: "paid",
    publishedLimit: "n/a",
    minIntervalMs: 0,
    costNote:
      "Enterprise research subscription — quoted in the thousands to tens of thousands of USD per year, per report family. One subscription per industry would cost more than everything else in this platform combined.",
    substitutedBy: ["derived-filings", "census-m3", "fred", "twse-monthly-revenue"],
    rejectedReason:
      "Price series are the LAGGING half of the memory model anyway (INDUSTRY-INTELLIGENCE §3: 'price is lagging confirmation; inventory is the leading signal'). Buying the lagging half at that price to skip the leading half we can compute for free is the wrong trade.",
  },
  {
    id: "semi-bookings",
    name: "SEMI equipment book-to-bill",
    serves: "(would serve) semiconductor equipment order momentum",
    status: "paid",
    publishedLimit: "n/a",
    minIntervalMs: 0,
    costNote: "SEMI membership plus report fees.",
    substitutedBy: ["derived-filings", "twse-monthly-revenue"],
    rejectedReason:
      "SEMI stopped publishing the public North America book-to-bill years ago, so even paying does not restore the series everyone quotes. Fab capex from filings leads equipment revenue by 2–3 quarters and is already in the database; Taiwan equipment suppliers file monthly revenue for free.",
  },

  {
    id: "google-news-rss",
    name: "Google News RSS",
    serves: "(was) news monitoring",
    status: "rejected",
    publishedLimit: "n/a",
    minIntervalMs: 0,
    rejectedReason:
      "Returns 503 to Cloudflare Workers specifically — the only one of eight free sources that blocks datacentre egress. Verified via /v1/ingest/probe. Superseded by Yahoo Finance RSS, which is ticker-scoped and a better fit.",
  },
];

export const SOURCE_BY_ID = new Map(DATA_SOURCES.map((s) => [s.id, s]));

/* ── Rate limiting ─────────────────────────────────────────────────────── */

const lastCallAt = new Map<string, number>();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Space requests to one source by its registered minimum interval.
 *
 * Deliberately a simple serial gate rather than a token bucket: bursting up to
 * a published ceiling is exactly how an IP gets banned by a provider that
 * measures over a shorter window than you assumed. Steady spacing costs a few
 * seconds on a sweep and cannot trip anything.
 *
 * Per-isolate, so it bounds one ingestion run rather than global traffic —
 * which is the right scope, because ingestion is what makes bursts.
 */
export async function throttle(sourceId: string): Promise<void> {
  const source = SOURCE_BY_ID.get(sourceId);
  const interval = source?.minIntervalMs ?? 1000;
  if (interval <= 0) return;

  const last = lastCallAt.get(sourceId);
  const now = Date.now();
  if (last !== undefined) {
    const wait = interval - (now - last);
    if (wait > 0) await sleep(wait);
  }
  lastCallAt.set(sourceId, Date.now());
}

/**
 * Fetch through the throttle, with one retry on the two statuses that mean
 * "you are going too fast" — 429 and 503. A single backoff is enough: if a
 * second attempt also fails the run should surface the failure rather than
 * keep hammering a provider that is already unhappy.
 */
export async function politeFetch(
  sourceId: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  await throttle(sourceId);
  const res = await fetch(url, init);
  if (res.status !== 429 && res.status !== 503) return res;

  // Honour Retry-After when the provider states one; otherwise back off by a
  // full interval.
  const retryAfter = Number(res.headers.get("retry-after"));
  const backoff = Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.min(retryAfter * 1000, 30_000)
    : (SOURCE_BY_ID.get(sourceId)?.minIntervalMs ?? 1000) * 2;
  await sleep(backoff);
  await throttle(sourceId);
  return fetch(url, init);
}
