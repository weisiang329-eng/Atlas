/**
 * Verifies the free-source ingestion.
 *
 * The behaviour that matters is TAGGING PRECISION. A missed tag is
 * recoverable — the item is still in the feed. A wrong tag pollutes the
 * knowledge graph and makes a company look like it was in the news when it
 * was not, which is worse than silence.
 */
import { parseRss, tagItem, dedupe } from "../src/ingest/news.ts";

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

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
