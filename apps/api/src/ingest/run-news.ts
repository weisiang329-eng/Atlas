/**
 * The news pull, as one function two callers share.
 *
 * `POST /v1/ingest/news` (manual, operational) and the Workers Cron trigger
 * (scheduled, in `index.ts`) must do EXACTLY the same thing — pull every
 * covered ticker's feed, tag on the headline, store idempotently — or the feed
 * a person triggers by hand and the feed that refreshes on a schedule drift
 * apart. So the logic lives here, not inside the route handler, and both call
 * it. See HANDOFF §13.3 follow-up (a): the /news page prints "last pulled"
 * precisely because nothing scheduled this until now.
 */
import type { createDb } from "../db/repo.ts";
import { listCompanies } from "../db/repo.ts";
import { newsItem } from "../db/schema.ts";
import {
  dedupe,
  fetchNews,
  tagItem,
  companyTerms,
  NEWS_ALIASES,
  type TaggingSubject,
} from "./news.ts";

export interface NewsIngestResult {
  source: string;
  queries: number;
  failedQueries: string[];
  fetched: number;
  unique: number;
  tagged: number;
  stored: number;
}

/**
 * Pull, tag and store the coverage universe's news. Never throws for a single
 * dead feed — one failed ticker is recorded in `failedQueries`, not fatal, so a
 * scheduled run degrades to partial coverage instead of storing nothing.
 */
export async function runNewsIngest(
  db: ReturnType<typeof createDb>,
): Promise<NewsIngestResult> {
  const companies = await listCompanies(db);

  const subjects: TaggingSubject[] = companies.map((co) => ({
    companyId: co.id,
    // Legal name, ticker, curated aliases, and the name with trailing legal /
    // descriptor forms peeled off — so "Nvidia" and "Micron" tag as readily as
    // the full legal name a headline never uses.
    terms: companyTerms(co.name, co.ticker ?? null, NEWS_ALIASES[co.ticker ?? ""] ?? []),
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

  return {
    source: "Yahoo Finance RSS (ticker-scoped)",
    queries: queries.length,
    failedQueries: failures,
    fetched: collected.length,
    unique: items.length,
    tagged: items.filter((i) => i.companyIds.length > 0).length,
    stored,
  };
}
