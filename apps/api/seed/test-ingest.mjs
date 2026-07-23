/**
 * Verifies the free-source ingestion AND the feed presenter that renders it.
 *
 * The behaviour that matters is TAGGING PRECISION. A missed tag is
 * recoverable — the item is still in the feed. A wrong tag pollutes the
 * knowledge graph and makes a company look like it was in the news when it
 * was not, which is worse than silence.
 *
 * The presenter is here rather than in its own suite because it defends the
 * same property from the other end: the query that surfaced an item must
 * never be promoted into a company tag, and a missing publisher must never be
 * invented.
 */
import { parseRss, tagItem, dedupe, companyTerms, NEWS_ALIASES } from "../src/ingest/news.ts";
import { hostOf, presentNewsItem, presentNewsFeed } from "../src/domain/news.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const SUBJECTS = [
  { companyId: "top-glove", terms: ["Top Glove Corporation", "TOPGLOV"], industryId: "rubber-gloves" },
  { companyId: "amd", terms: ["Advanced Micro Devices", "AMD"], industryId: "semis-accelerators" },
  { companyId: "micron", terms: ["Micron Technology", "MU"], industryId: "semis-memory" },
];

console.log("--- RSS parsing ---");
{
  const xml = `<rss><channel>
    <item><title>Top Glove Corporation posts Q2 results</title><link>https://x.test/a</link>
      <pubDate>Mon, 20 Jul 2026 09:00:00 GMT</pubDate><source url="https://r.test">Reuters</source></item>
    <item><title><![CDATA[AMD &amp; partners expand]]></title><link>https://x.test/b</link>
      <pubDate>Tue, 21 Jul 2026 10:30:00 GMT</pubDate><source url="https://b.test">Bloomberg</source></item>
    <item><title>No link here</title></item>
  </channel></rss>`;
  const items = parseRss(xml, "test");
  check("items with a link are parsed", items.length, 2);
  check("an item without a link is skipped", items.every(i => i.link), true);
  check("CDATA and entities decoded", items[1].title, "AMD & partners expand");
  check("publisher extracted", items[0].publisher, "Reuters");
  check("pubDate normalised to ISO", items[0].publishedAt, (v) => v.startsWith("2026-07-20T"));
  check("query recorded for the audit trail", items[0].query, "test");
}

console.log("\n--- tagging precision (the part that must not be sloppy) ---");
{
  const t = (title) => tagItem({ title, link: "l", publisher: null, publishedAt: null, query: "q" }, SUBJECTS);

  check("full name matches", t("Top Glove Corporation reports").companyIds, ["top-glove"]);
  check("ticker matches", t("TOPGLOV shares rise on Bursa").companyIds, ["top-glove"]);
  check("industry inherited from the company", t("TOPGLOV shares rise").industryIds, ["rubber-gloves"]);

  // The dangerous cases: short tickers inside longer words.
  check("AMD does NOT match inside AMDAHL", t("AMDAHL legacy systems retired").companyIds, []);
  check("MU does NOT match inside MUSK", t("MUSK announces new venture").companyIds, []);
  check("MU does NOT match inside MUMBAI", t("MUMBAI exchange update").companyIds, []);
  check("AMD DOES match as its own word", t("AMD launches new GPU").companyIds, ["amd"]);
  check("MU DOES match as its own word", t("MU stock climbs after earnings").companyIds, ["micron"]);

  check("matching is case-insensitive", t("top glove corporation update").companyIds, ["top-glove"]);
  check("punctuation boundaries work", t("Shares of AMD, Intel fall").companyIds, ["amd"]);
  check("two companies in one headline both tag", t("AMD and Micron Technology partner").companyIds.sort(), ["amd","micron"]);
  check("an untagged headline stays untagged", t("Weather forecast for Tuesday").companyIds, []);
}

console.log("\n--- term generation: recall without a precision leak ---");
{
  const has = (terms, t) => terms.some((x) => x.toLowerCase() === t.toLowerCase());

  // Suffix stripping is what closes the biggest live recall gap: headlines say
  // the short name, the roster stores the legal one.
  check("legal suffix peeled: NVIDIA", companyTerms("NVIDIA Corporation", "NVDA"), (ts) => has(ts, "NVIDIA"));
  check("legal suffix peeled: Intel", companyTerms("Intel Corporation", "INTC"), (ts) => has(ts, "Intel"));
  check("holdings peeled: Vertiv", companyTerms("Vertiv Holdings", "VRT"), (ts) => has(ts, "Vertiv"));
  check("holding peeled: ASML", companyTerms("ASML Holding", "ASML"), (ts) => has(ts, "ASML"));
  check("descriptor peeled: Micron", companyTerms("Micron Technology", "MU"), (ts) => has(ts, "Micron"));
  check("descriptor peeled: Arista", companyTerms("Arista Networks", "ANET"), (ts) => has(ts, "Arista"));

  // The name + ticker are always kept.
  check("legal name is always a term", companyTerms("Micron Technology", "MU"), (ts) => has(ts, "Micron Technology"));
  check("ticker is always a term", companyTerms("Micron Technology", "MU"), (ts) => has(ts, "MU"));

  // Aliases reach what stripping cannot.
  check("alias reaches TSMC", companyTerms("Taiwan Semiconductor Mfg.", "TSM", NEWS_ALIASES["TSM"]), (ts) => has(ts, "TSMC"));
  check("mid-strip phrase kept for TSMC", companyTerms("Taiwan Semiconductor Mfg.", "TSM"), (ts) => has(ts, "Taiwan Semiconductor"));
  check("alias reaches Hynix", companyTerms("SK hynix", "000660", NEWS_ALIASES["000660"]), (ts) => has(ts, "Hynix"));

  // The precision guard: stripping must NOT manufacture a generic lone token.
  check("stripping stops before the bare stopword 'Taiwan'", companyTerms("Taiwan Semiconductor Mfg.", "TSM"), (ts) => !has(ts, "Taiwan"));
  check("AMD gains no over-broad term ('Advanced' never appears)", companyTerms("Advanced Micro Devices", "AMD"), (ts) => !has(ts, "Advanced"));

  // End-to-end: the generated terms tag the short-name headlines that used to
  // slip through, and still refuse the dangerous substrings.
  const roster = [
    { companyId: "nvidia", terms: companyTerms("NVIDIA Corporation", "NVDA"), industryId: "semis-accelerators" },
    { companyId: "micron", terms: companyTerms("Micron Technology", "MU"), industryId: "semis-memory" },
    { companyId: "intel", terms: companyTerms("Intel Corporation", "INTC"), industryId: "semis-foundry" },
    { companyId: "tsmc", terms: companyTerms("Taiwan Semiconductor Mfg.", "TSM", NEWS_ALIASES["TSM"]), industryId: "semis-foundry" },
  ];
  const tg = (title) => tagItem({ title, link: "l", publisher: null, publishedAt: null, query: "q" }, roster).companyIds;
  check("short name 'Nvidia' now tags (was a miss)", tg("Nvidia beats on data-center revenue"), ["nvidia"]);
  check("short name 'Micron' now tags (was a miss)", tg("Micron guides higher on HBM demand"), ["micron"]);
  check("press form 'TSMC' now tags (was a miss)", tg("TSMC raises capex outlook"), ["tsmc"]);
  // Word boundaries still hold for the new short terms — the property that
  // makes stripping safe to ship. 'Intel' must not ride on 'intelligence',
  // and 'Micron' must not ride on the plural unit 'microns'.
  check("'Intel' does not tag on the word 'intelligence'", tg("Artificial intelligence demand surges"), []);
  check("'Micron' does not tag on the plural unit 'microns'", tg("Feature sizes measured in microns"), []);
}

console.log("\n--- de-duplication unions tags rather than overwriting ---");
{
  const mk = (link, companyIds, industryIds) => ({
    title: "t", link, publisher: null, publishedAt: null, query: "q", companyIds, industryIds,
  });
  const out = dedupe([
    mk("https://x.test/1", ["amd"], ["semis-accelerators"]),
    mk("https://x.test/1", ["micron"], ["semis-memory"]),
    mk("https://x.test/2", ["top-glove"], ["rubber-gloves"]),
  ]);
  check("duplicates collapsed by link", out.length, 2);
  const merged = out.find(i => i.link === "https://x.test/1");
  check("company tags unioned, not overwritten", merged.companyIds.sort(), ["amd","micron"]);
  check("industry tags unioned too", merged.industryIds.sort(), ["semis-accelerators","semis-memory"]);
}

console.log("\n--- feed presentation (what the page is allowed to claim) ---");
{
  const ROSTER = [
    { id: "nvidia", name: "NVIDIA Corporation", ticker: "NVDA" },
    { id: "micron", name: "Micron Technology", ticker: "MU" },
  ];
  const byId = new Map(ROSTER.map((c) => [c.id, c]));
  const row = (over) => ({
    id: "i1", title: "t", link: "https://www.fool.com/investing/x", publisher: null,
    publishedAt: new Date("2026-07-20T09:00:00Z"), query: "NVDA",
    companyIds: null, industryIds: null, fetchedAt: new Date("2026-07-22T01:03:00Z"),
    ...over,
  });

  check("host derived, www stripped", hostOf("https://www.fool.com/a"), "fool.com");
  check("a malformed link yields no host", hostOf("not a url"), null);

  const derived = presentNewsItem(row(), byId);
  check("no publisher ⇒ source falls back to the host", derived.source, "fool.com");
  check("the fallback is flagged as derived", derived.sourceDerived, true);

  const stated = presentNewsItem(row({ publisher: "Reuters" }), byId);
  check("a stated publisher is used as-is", stated.source, "Reuters");
  check("a stated publisher is not flagged derived", stated.sourceDerived, false);

  // THE property. Production measured 30 tagged out of 100 pulled: a ticker
  // feed carries general market copy, so `query` is provenance only.
  check("the query does NOT become a company tag", derived.companies, []);
  check("the query is still exposed as provenance", derived.query, "NVDA");

  const tagged = presentNewsItem(row({ companyIds: "nvidia,micron" }), byId);
  check("tagged ids resolve to companies", tagged.companies.map((c) => c.ticker), ["NVDA", "MU"]);

  const stale = presentNewsItem(row({ companyIds: "nvidia,delisted-co" }), byId);
  check("a tag for a company we no longer cover is dropped, not rendered dead",
    stale.companies.map((c) => c.id), ["nvidia"]);

  check("dates leave as ISO strings", derived.publishedAt, "2026-07-20T09:00:00.000Z");

  const feed = presentNewsFeed(
    [row({ id: "a", fetchedAt: new Date("2026-07-21T00:00:00Z") }),
     row({ id: "b", fetchedAt: new Date("2026-07-22T01:03:00Z") })],
    ROSTER,
    { total: 100, tagged: 30 },
  );
  check("lastFetchedAt is the newest pull, not the first row",
    feed.lastFetchedAt, "2026-07-22T01:03:00.000Z");
  check("unfiltered totals are reported so the page can say what it hides",
    [feed.total, feed.tagged], [100, 30]);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
