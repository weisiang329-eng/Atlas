/**
 * /v1/ingest — pulls from the free public sources.
 *
 * Every source here is key-free, so ingestion works today without waiting on
 * a paid feed. The sources that DO need a key (Finnhub for quotes, FRED for
 * commodity series) are tracked in HANDOFF as a waiting list; nothing here
 * fabricates a stand-in for them.
 */
import { Hono } from "hono";
import { desc } from "drizzle-orm";
import type { Sql } from "postgres";
import type { Env } from "../index.ts";
import { createDb } from "../db/repo.ts";
import { pmsFxRate } from "../db/schema.ts";
import { fetchBnmRates } from "../ingest/fx.ts";
import { runNewsIngest } from "../ingest/run-news.ts";
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
 * Pull and tag news for the coverage universe (manual trigger).
 *
 * The pull itself lives in `ingest/run-news.ts` so the Workers Cron trigger in
 * `index.ts` runs the identical path — a feed refreshed by hand and a feed
 * refreshed on a schedule must never drift.
 */
ingest.post("/news", async (c) => {
  const result = await runNewsIngest(c.get("db"));
  return c.json(result);
});

/*
 * Reading the feed lives at `GET /v1/news` (routes/news.ts), not here.
 * It used to return raw rows from this namespace; that meant two endpoints
 * could answer "what is in the news feed" differently, and the raw one leaked
 * storage detail (comma-joined id columns, a null publisher) into whatever
 * consumed it. One read path, one presenter.
 */

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
