/**
 * News ingestion from a free, key-free feed.
 *
 * Serves the News Research Analyst's mandate: monitor events and TAG every one
 * to industries, companies, products and KPIs. The spec is explicit that
 * tagging is the deliverable — an untagged headline is not knowledge, because
 * nothing downstream can traverse to it.
 *
 * Limits worth stating: the feed returns headlines and publishers, not article
 * bodies. It is a MONITORING SURFACE, not a source of record — nothing in the
 * financial engine may read a number from here.
 */

import { politeFetch } from "./sources";

export interface RawNewsItem {
  title: string;
  link: string;
  publisher: string | null;
  publishedAt: string | null;
  /** The query that surfaced it — the first tag, and the audit trail. */
  query: string;
}

export interface TaggedNewsItem extends RawNewsItem {
  companyIds: string[];
  industryIds: string[];
}

/**
 * Yahoo Finance RSS, keyed by ticker.
 *
 * Google News RSS was the first choice and is unusable here: it returns 503 to
 * Cloudflare Workers specifically (verified via /v1/ingest/probe — it is the
 * only one of eight free sources that blocks datacentre egress). Yahoo is
 * ticker-scoped rather than keyword-scoped, which is actually the better fit:
 * a feed for "NVDA" cannot drift onto an unrelated company the way a search
 * for "Micron" can.
 */
const FEED = "https://feeds.finance.yahoo.com/rss/2.0/headline";

/** Decode the handful of XML entities RSS actually uses. */
function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

const tag = (block: string, name: string): string | null => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(block);
  return m ? decode(m[1]!) : null;
};

/**
 * Parse an RSS document.
 *
 * Regex rather than a DOM parser because Workers have no DOMParser and the
 * shape here is fixed and shallow — pulling in an XML library to read four
 * fields would cost more than it protects.
 */
export function parseRss(xml: string, query: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1]!;
    const title = tag(block, "title");
    const link = tag(block, "link");
    if (!title || !link) continue;

    const pub = tag(block, "pubDate");
    let publishedAt: string | null = null;
    if (pub) {
      const d = new Date(pub);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString();
    }

    items.push({
      title,
      link,
      publisher: tag(block, "source"),
      publishedAt,
      query,
    });
  }
  return items;
}

export interface TaggingSubject {
  companyId: string;
  /** Every string that should match this company: name, ticker, aliases. */
  terms: string[];
  industryId: string | null;
}

/**
 * Tag an item to the entities it mentions.
 *
 * Word-boundary matching, because a substring match turns "AMD" into a hit on
 * "AMDAHL" and a ticker like "MU" into a hit on half the dictionary. A missed
 * tag is recoverable; a wrong one pollutes the graph.
 */
export function tagItem(
  item: RawNewsItem,
  subjects: TaggingSubject[],
): TaggedNewsItem {
  const haystack = item.title.toLowerCase();
  const companyIds = new Set<string>();
  const industryIds = new Set<string>();

  for (const s of subjects) {
    const hit = s.terms.some((term) => {
      const t = term.trim().toLowerCase();
      if (t.length < 2) return false;
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
    });
    if (hit) {
      companyIds.add(s.companyId);
      if (s.industryId) industryIds.add(s.industryId);
    }
  }

  return {
    ...item,
    companyIds: [...companyIds],
    industryIds: [...industryIds],
  };
}

/** Fetch one ticker feed. `symbol` is the exchange ticker, e.g. NVDA. */
export async function fetchNews(symbol: string): Promise<RawNewsItem[]> {
  const url = new URL(FEED);
  url.searchParams.set("s", symbol);
  url.searchParams.set("region", "US");
  url.searchParams.set("lang", "en-US");

  // Through the throttle: a ten-ticker sweep is exactly the shape of request
  // burst that gets an IP rate-limited.
  const res = await politeFetch("yahoo-finance-rss", url.toString(), {
    headers: { "User-Agent": "Atlas Research Platform" },
  });
  if (!res.ok) throw new Error(`Yahoo Finance RSS ${res.status}`);
  return parseRss(await res.text(), symbol);
}

/** De-duplicate by link, keeping the earliest-seen tagging. */
export function dedupe(items: TaggedNewsItem[]): TaggedNewsItem[] {
  const byLink = new Map<string, TaggedNewsItem>();
  for (const i of items) {
    const existing = byLink.get(i.link);
    if (!existing) {
      byLink.set(i.link, i);
      continue;
    }
    // The same story can surface under several queries; union the tags rather
    // than letting whichever query ran last decide what it is about.
    byLink.set(i.link, {
      ...existing,
      companyIds: [...new Set([...existing.companyIds, ...i.companyIds])],
      industryIds: [...new Set([...existing.industryIds, ...i.industryIds])],
    });
  }
  return [...byLink.values()];
}
