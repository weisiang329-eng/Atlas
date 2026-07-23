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

import { politeFetch } from "./sources.ts";

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
 * only one of eight free sources that blocks datacentre egress).
 *
 * This comment used to claim that a ticker-scoped feed "cannot drift onto an
 * unrelated company the way a keyword search can". Measured against the 100
 * rows production had stored (2026-07-22): only 30 mention any company in the
 * coverage universe — the NVDA feed carries "SpaceX Is Down 20%" and "Should
 * You Buy Moderna Stock". Ticker scoping constrains the QUERY, not the
 * content. That is why `query` is stored as provenance and only `tagItem`'s
 * match on the headline produces a tag.
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
 * Curated match aliases, keyed by ticker (stable across renames).
 *
 * These are the cases suffix-stripping below cannot reach: "TSMC" is a
 * substring of neither the legal name "Taiwan Semiconductor Mfg." nor the
 * ticker "TSM", yet it is what every headline calls the company. Kept small and
 * hand-verified against the covered roster — a loose alias is a precision leak,
 * and precision is the property this module exists to protect.
 */
export const NEWS_ALIASES: Record<string, string[]> = {
  TSM: ["TSMC"],
  "000660": ["SK Hynix", "Hynix"],
};

/** Trailing legal-entity forms a headline routinely drops. */
const LEGAL_SUFFIX =
  /\s+(corporation|corp|incorporated|inc|company|co|limited|ltd|plc|llc|lp|nv|se|ag|sa|berhad|bhd|holdings?|group|mfg|manufacturing)$/i;

/** Trailing descriptors a headline routinely drops ("Micron", not "Micron Technology"). */
const DESCRIPTOR_SUFFIX =
  /\s+(technolog(?:y|ies)|networks?|systems?|semiconductors?|electronics|industries)$/i;

/**
 * Lone tokens too generic to carry a company tag on their own. A one-word
 * remainder that lands here is kept for further stripping but never added as a
 * term — "Taiwan" must not tag TSMC on a headline about the country.
 */
const STOPWORDS = new Set([
  "taiwan", "advanced", "applied", "general", "american", "national", "united",
  "global", "micro", "first", "pacific", "industries", "holdings", "group",
  "technology", "networks", "systems", "the",
]);

/**
 * Every string that should tag one company: its legal name, its ticker, any
 * curated aliases, and the name with trailing legal/descriptor forms peeled off
 * one at a time. Peeling is what lets "Nvidia" match "NVIDIA Corporation" and
 * "Micron" match "Micron Technology" — the single most common recall miss on
 * the live feed. A one-word remainder that is a stopword (or under three
 * characters) is dropped, so stripping never manufactures a term generic enough
 * to false-positive. The word-boundary matcher in `tagItem` still guards every
 * term that survives.
 */
export function companyTerms(
  name: string,
  ticker: string | null,
  aliases: string[] = [],
): string[] {
  const terms = new Set<string>();
  const add = (t: string): void => {
    const s = t.trim();
    if (s.length >= 2) terms.add(s);
  };
  add(name);
  if (ticker) add(ticker);
  for (const a of aliases) add(a);

  // Normalise punctuation so "Mfg." and "Mfg" strip the same way.
  let base = name.replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 4; i += 1) {
    const m = LEGAL_SUFFIX.exec(base) ?? DESCRIPTOR_SUFFIX.exec(base);
    if (!m) break;
    base = base.slice(0, m.index).trim();
    if (!base) break;
    const loneGeneric =
      !base.includes(" ") &&
      (STOPWORDS.has(base.toLowerCase()) || base.length < 3);
    if (!loneGeneric) add(base);
  }
  return [...terms];
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
