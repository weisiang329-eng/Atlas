/**
 * News feed presentation — the layer between `news_item` rows and the screen.
 *
 * Two honesty problems live here, and both are the reason this is a presenter
 * rather than a `SELECT *`:
 *
 * 1. **The publisher is usually missing.** Yahoo's headline RSS omits the
 *    `<source>` element far more often than it includes it, so `publisher` is
 *    null on most stored rows. Rather than render a blank byline (or worse,
 *    invent one), the display source falls back to the LINK'S HOST — a fact
 *    the reader can check by following the link, flagged as derived so nobody
 *    mistakes it for something the feed asserted.
 *
 * 2. **The query that surfaced an item is not a claim about what it is
 *    about.** Measured against production on 2026-07-22: of 100 stored items
 *    pulled from ticker-scoped feeds, only 30 mention a company in the
 *    coverage universe. Yahoo's per-ticker feed carries general market
 *    commentary — a "SpaceX is down 20%" piece arrives under NVDA. So `query`
 *    is exposed as PROVENANCE ("this came out of the NVDA feed") and never
 *    promoted into a company tag. Tags come only from `tagItem`'s
 *    word-boundary match on the headline itself.
 *
 * Nothing here reads a number. A headline is a monitoring signal, never a
 * source of record — that rule lives in the schema comment and holds here.
 */

/** One company an item was tagged to, resolved for display and linking. */
export interface NewsCompanyDto {
  id: string;
  name: string;
  ticker: string | null;
}

export interface NewsFeedItemDto {
  id: string;
  title: string;
  link: string;
  /** Publisher when the feed named one, else the link's host. */
  source: string;
  /** True when `source` was inferred from the URL rather than asserted. */
  sourceDerived: boolean;
  publishedAt: string | null;
  /** The ticker feed this surfaced in. Provenance — NOT a company tag. */
  query: string | null;
  companies: NewsCompanyDto[];
  industryIds: string[];
}

export interface NewsFeedDto {
  items: NewsFeedItemDto[];
  /** When the pipeline last stored anything — the feed's real freshness. */
  lastFetchedAt: string | null;
  /** Totals BEFORE any filter, so the UI can state what it is hiding. */
  total: number;
  tagged: number;
}

/** The stored shape this presenter consumes (mirrors `news_item`). */
export interface NewsRow {
  id: string;
  title: string;
  link: string;
  publisher: string | null;
  publishedAt: Date | string | null;
  query: string | null;
  companyIds: string | null;
  industryIds: string | null;
  fetchedAt: Date | string | null;
}

/**
 * The host of a URL, minus `www.`.
 *
 * A malformed link is not worth a 500 — the row still has a title worth
 * showing, so an unparseable URL degrades to a neutral label.
 */
export function hostOf(link: string): string | null {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** The comma-joined id columns, back into a list. */
export function splitIds(csv: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const iso = (v: Date | string | null): string | null =>
  v === null ? null : v instanceof Date ? v.toISOString() : v;

export function presentNewsItem(
  row: NewsRow,
  companiesById: Map<string, NewsCompanyDto>,
): NewsFeedItemDto {
  const derived = !row.publisher;
  return {
    id: row.id,
    title: row.title,
    link: row.link,
    source: row.publisher ?? hostOf(row.link) ?? "unknown source",
    sourceDerived: derived,
    publishedAt: iso(row.publishedAt),
    query: row.query,
    // A tag pointing at a company we no longer cover is dropped rather than
    // rendered as a dead chip; the id stays in the row for later.
    companies: splitIds(row.companyIds)
      .map((id) => companiesById.get(id))
      .filter((c): c is NewsCompanyDto => Boolean(c)),
    industryIds: splitIds(row.industryIds),
  };
}

export function presentNewsFeed(
  rows: NewsRow[],
  companies: NewsCompanyDto[],
  totals: { total: number; tagged: number },
): NewsFeedDto {
  const byId = new Map(companies.map((c) => [c.id, c]));
  const items = rows.map((r) => presentNewsItem(r, byId));

  const fetched = rows
    .map((r) => iso(r.fetchedAt))
    .filter((v): v is string => Boolean(v))
    .sort();

  return {
    items,
    lastFetchedAt: fetched.length > 0 ? fetched[fetched.length - 1]! : null,
    total: totals.total,
    tagged: totals.tagged,
  };
}
