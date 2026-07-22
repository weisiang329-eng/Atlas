/**
 * /v1/ingest — pulls from the free public sources.
 *
 * Every source here is key-free, so ingestion works today without waiting on
 * a paid feed. The sources that DO need a key (Finnhub for quotes, FRED for
 * commodity series) are tracked in HANDOFF as a waiting list; nothing here
 * fabricates a stand-in for them.
 */
import { Hono } from "hono";
import { desc, sql } from "drizzle-orm";
import type { Sql } from "postgres";
import type { Env } from "../index.ts";
import { createDb, listCompanies } from "../db/repo.ts";
import { newsItem, pmsFxRate } from "../db/schema.ts";
import { fetchBnmRates } from "../ingest/fx.ts";
import { dedupe, fetchNews, tagItem, type TaggingSubject } from "../ingest/news.ts";
import { DATA_SOURCES } from "../ingest/sources.ts";
import { ingestEdgarQuarters } from "../ingest/edgar.ts";

type AppEnv = {
  Bindings: Env;
  Variables: { db: ReturnType<typeof createDb>; sql: Sql };
};

export const ingest = new Hono<AppEnv>();

/** Pull BNM middle rates into pms_fx_rate. */
ingest.post("/fx", async (c) => {
  const db = c.get("db");
  const quotes = await fetchBnmRates();

  for (const q of quotes) {
    await db
      .insert(pmsFxRate)
      .values({
        rateDate: q.date,
        fromCurrency: q.fromCurrency,
        toCurrency: q.toCurrency,
        rate: q.rate,
        halfSpreadPct: q.halfSpreadPct,
        provider: "BNM",
      })
      .onConflictDoUpdate({
        target: [pmsFxRate.rateDate, pmsFxRate.fromCurrency, pmsFxRate.toCurrency],
        set: {
          rate: q.rate,
          halfSpreadPct: q.halfSpreadPct,
          provider: "BNM",
        },
      });
  }

  return c.json({ source: "BNM", stored: quotes.length, quotes });
});

/** Latest stored rate per currency — what the ledger reads. */
ingest.get("/fx", async (c) => {
  const db = c.get("db");
  const rows = await db
    .select()
    .from(pmsFxRate)
    .orderBy(desc(pmsFxRate.rateDate))
    .limit(30);
  return c.json({ rates: rows });
});

/**
 * Pull and tag news for the coverage universe.
 *
 * One query per company plus a couple of industry-level queries. Google's feed
 * is capped per query, so a handful of narrow queries returns more usable
 * coverage than one broad one.
 */
ingest.post("/news", async (c) => {
  const db = c.get("db");
  const companies = await listCompanies(db);

  const subjects: TaggingSubject[] = companies.map((co) => ({
    companyId: co.id,
    // Ticker and full name; the short name too when it differs usefully.
    terms: [co.name, co.ticker].filter(Boolean) as string[],
    industryId: co.industryId ?? null,
  }));

  // Ticker-scoped feeds. Only US-listed names have a Yahoo feed that resolves
  // cleanly; Bursa tickers are skipped rather than queried and silently
  // returning another market's company.
  const queries = companies
    .filter((co) => co.exchange !== "Bursa Malaysia" && co.ticker)
    .map((co) => co.ticker!);

  const collected = [];
  const failures: string[] = [];
  for (const q of queries) {
    try {
      const raw = await fetchNews(q);
      collected.push(...raw.map((r) => tagItem(r, subjects)));
    } catch (e) {
      // One dead query must not lose the whole run; report which failed AND
      // why — a bare list of names cannot be diagnosed.
      const why = e instanceof Error ? e.message : String(e);
      failures.push(`${q} :: ${why}`);
    }
  }

  const items = dedupe(collected);
  let stored = 0;
  for (const i of items) {
    const id = `yf:${i.link.slice(-64)}`;
    await db
      .insert(newsItem)
      .values({
        id,
        title: i.title,
        link: i.link,
        publisher: i.publisher,
        publishedAt: i.publishedAt ? new Date(i.publishedAt) : null,
        query: i.query,
        companyIds: i.companyIds.join(",") || null,
        industryIds: i.industryIds.join(",") || null,
      })
      .onConflictDoNothing();
    stored += 1;
  }

  const tagged = items.filter((i) => i.companyIds.length > 0).length;
  return c.json({
    source: "Yahoo Finance RSS (ticker-scoped)",
    queries: queries.length,
    failedQueries: failures,
    fetched: collected.length,
    unique: items.length,
    tagged,
    stored,
  });
});

/** The tagged feed, newest first. */
ingest.get("/news", async (c) => {
  const db = c.get("db");
  const company = c.req.query("company");
  const rows = await db
    .select()
    .from(newsItem)
    .where(
      company
        ? sql`${newsItem.companyIds} LIKE ${"%" + company + "%"}`
        : undefined,
    )
    .orderBy(desc(newsItem.publishedAt))
    .limit(100);
  return c.json({ items: rows });
});

/**
 * Probe which free sources are reachable FROM THE WORKER.
 *
 * Reachability from a laptop proves nothing: several providers serve
 * datacentre egress differently, and Google News returns 503 to Cloudflare
 * Workers specifically. This endpoint records what actually works from where
 * the code runs, so source selection is evidence rather than assumption.
 */
ingest.get("/probe", async (c) => {
  const targets: { name: string; url: string; headers?: Record<string, string> }[] = [
    {
      name: "google-news-rss",
      url: "https://news.google.com/rss/search?q=NVIDIA&hl=en-US&gl=US&ceid=US:en",
    },
    {
      name: "yahoo-finance-rss",
      url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=NVDA&region=US&lang=en-US",
    },
    {
      name: "bing-news-rss",
      url: "https://www.bing.com/news/search?q=NVIDIA&format=RSS",
    },
    {
      name: "sec-edgar-filings-atom",
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K&count=10&output=atom",
      headers: { "User-Agent": "Atlas Research atlas@houzscentury.com" },
    },
    {
      name: "sec-edgar-fulltext",
      url: "https://efts.sec.gov/LATEST/search-index?q=%22nitrile%22",
      headers: { "User-Agent": "Atlas Research atlas@houzscentury.com" },
    },
    {
      name: "world-bank",
      url: "https://api.worldbank.org/v2/country/MYS/indicator/NY.GDP.MKTP.CD?format=json&per_page=1",
    },
    {
      name: "frankfurter-fx",
      url: "https://api.frankfurter.dev/v1/latest?base=USD&symbols=MYR",
    },
    { name: "bnm-fx", url: "https://api.bnm.gov.my/public/exchange-rate", headers: { Accept: "application/vnd.BNM.API.v1+json" } },
  ];

  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        const res = await fetch(t.url, {
          headers: { "User-Agent": "Atlas Research Platform", ...t.headers },
        });
        const body = await res.text();
        return {
          name: t.name,
          status: res.status,
          ok: res.ok,
          bytes: body.length,
          sample: body.slice(0, 60).replace(/\s+/g, " "),
        };
      } catch (e) {
        return {
          name: t.name,
          status: 0,
          ok: false,
          bytes: 0,
          sample: e instanceof Error ? e.message : String(e),
        };
      }
    }),
  );

  return c.json({ results });
});

/**
 * The source registry, with live key detection.
 *
 * One place that answers "what do we pull from, what is it limited to, and
 * what is still waiting on me" — previously that lived across chat messages,
 * which is exactly where it gets lost.
 */
ingest.get("/sources", async (c) => {
  const env = c.env as unknown as Record<string, string | undefined>;

  return c.json({
    sources: DATA_SOURCES.map((s) => ({
      ...s,
      // A source is only really connected when its key is actually present on
      // the Worker — the registry states intent, the env states reality.
      keyPresent: s.secretName
        ? Boolean(env[s.secretName] && env[s.secretName]!.length > 0)
        : null,
    })),
    summary: {
      connected: DATA_SOURCES.filter((s) => s.status === "connected").length,
      awaitingKey: DATA_SOURCES.filter(
        (s) =>
          s.status === "awaiting-key" &&
          !(s.secretName && env[s.secretName]),
      ).length,
      rejected: DATA_SOURCES.filter((s) => s.status === "rejected").length,
    },
  });
});

/**
 * Pull quarterly financials from SEC EDGAR into financial_period/_fact.
 *
 * POST /v1/ingest/edgar          whole roster
 * POST /v1/ingest/edgar?company=nvidia   one company
 *
 * Quarters land every 90 days, so this is a pull rather than a redeploy —
 * the annual seed is checked in, but 400+ quarterly periods and 8,000+ facts
 * would be a 3.4 MB SQL blob inside the Worker bundle.
 *
 * Requests are spaced by politeFetch at ~6.7/s against SEC's published 10/s;
 * their policy is enforced by IP ban, not by 429, so the margin is deliberate.
 */
ingest.post("/edgar", async (c) => {
  const only = c.req.query("company") ?? undefined;
  const results = await ingestEdgarQuarters(c.get("sql"), only);
  const failed = results.filter((r) => r.error);
  return c.json(
    {
      companies: results.length,
      quarters: results.reduce((n, r) => n + r.quarters, 0),
      facts: results.reduce((n, r) => n + r.facts, 0),
      results,
    },
    // Partial success is still success; a total failure is not.
    failed.length === results.length && results.length > 0 ? 502 : 200,
  );
});
