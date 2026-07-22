/**
 * /v1/news — the tagged monitoring feed, for the News page.
 *
 * This is the READ side of the pipeline whose write side is
 * `POST /v1/ingest/news`. It lives outside `/v1/ingest` because the ingest
 * namespace is operational (pull, probe, registry) while this is a product
 * surface a person looks at, and the two have different shapes: the raw rows
 * carry comma-joined id columns and a null publisher, which is storage detail,
 * not something to render. See `domain/news.ts` for what the presenter fixes.
 */
import { Hono } from "hono";
import { and, desc, isNotNull, ne, sql } from "drizzle-orm";
import type { Env } from "../index.ts";
import { createDb, listCompanies } from "../db/repo.ts";
import { newsItem } from "../db/schema.ts";
import { presentNewsFeed, type NewsCompanyDto } from "../domain/news.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const news = new Hono<AppEnv>();

const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 200;

/**
 * GET /v1/news
 *   ?company=nvidia   only items tagged to that company
 *   ?tagged=true      only items tagged to SOME covered company
 *   ?limit=60         1..200
 *
 * `tagged` matters because most of what a ticker feed returns is general
 * market commentary that names nobody we cover (30 of 100 in production).
 * Both views are honest; the UI defaults to the tagged one and says so.
 */
news.get("/", async (c) => {
  const db = c.get("db");
  const company = c.req.query("company");
  const taggedOnly = c.req.query("tagged") === "true";

  const requested = Number.parseInt(c.req.query("limit") ?? "", 10);
  const limit = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const hasTag = and(isNotNull(newsItem.companyIds), ne(newsItem.companyIds, ""));
  const where = company
    ? sql`${newsItem.companyIds} LIKE ${"%" + company + "%"}`
    : taggedOnly
      ? hasTag
      : undefined;

  const [rows, companies, counts] = await Promise.all([
    db
      .select()
      .from(newsItem)
      .where(where)
      .orderBy(desc(newsItem.publishedAt))
      .limit(limit),
    listCompanies(db),
    // Unfiltered totals, so the page can say "showing 30 of 100" rather than
    // implying the feed is smaller than it is.
    db
      .select({
        total: sql<number>`count(*)::int`,
        tagged: sql<number>`count(*) filter (where ${newsItem.companyIds} is not null and ${newsItem.companyIds} <> '')::int`,
      })
      .from(newsItem),
  ]);

  const roster: NewsCompanyDto[] = companies.map((co) => ({
    id: co.id,
    name: co.name,
    ticker: co.ticker,
  }));

  return c.json(
    presentNewsFeed(rows, roster, {
      total: counts[0]?.total ?? 0,
      tagged: counts[0]?.tagged ?? 0,
    }),
  );
});
