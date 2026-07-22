/**
 * Verifies the source registry and its rate limiting.
 *
 * The limit that matters is SEC EDGAR's: ten requests per second, enforced by
 * BANNING the IP rather than by returning 429. A configuration that sits at
 * the ceiling is a configuration that eventually crosses it.
 */
import { DATA_SOURCES, SOURCE_BY_ID, throttle } from "../src/ingest/sources.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- the registry is complete and internally consistent ---");
{
  check("ids are unique", new Set(DATA_SOURCES.map(s => s.id)).size, DATA_SOURCES.length);
  check("every source declares its published limit",
    DATA_SOURCES.every(s => typeof s.publishedLimit === "string" && s.publishedLimit.length > 0), true);
  check("every key-gated source names its secret",
    DATA_SOURCES.filter(s => s.status === "awaiting-key").every(s => s.secretName), true);
  check("every key-gated source has a registration link",
    DATA_SOURCES.filter(s => s.status === "awaiting-key").every(s => s.registerUrl), true);
  check("every key-gated source has steps",
    DATA_SOURCES.filter(s => s.status === "awaiting-key").every(s => (s.steps?.length ?? 0) >= 2), true);
  check("every rejected source records WHY",
    DATA_SOURCES.filter(s => s.status === "rejected").every(s => s.rejectedReason), true);
  check("connected sources need no key",
    DATA_SOURCES.filter(s => s.status === "connected").every(s => !s.secretName), true);
}

console.log("\n--- rate limits stay UNDER the published ceiling ---");
{
  const sec = SOURCE_BY_ID.get("sec-edgar");
  // 10 req/s = 100ms. Anything at or below 100ms rides the ceiling.
  check("SEC interval is below its 10/s ceiling", sec.minIntervalMs > 100, true);
  check("SEC interval leaves real headroom (>=150ms)", sec.minIntervalMs >= 150, true);

  const finnhub = SOURCE_BY_ID.get("finnhub");
  // 60/min = 1000ms exactly.
  check("Finnhub interval respects 60/min", finnhub.minIntervalMs >= 1000, true);

  const av = SOURCE_BY_ID.get("alphavantage");
  // 5/min = 12000ms.
  check("Alpha Vantage interval respects 5/min", av.minIntervalMs >= 12000, true);

  const fred = SOURCE_BY_ID.get("fred");
  // 120/min = 500ms.
  check("FRED interval respects 120/min", fred.minIntervalMs >= 500, true);

  check("no active source is unthrottled",
    DATA_SOURCES.filter(s => s.status !== "rejected").every(s => s.minIntervalMs > 0), true);
}

console.log("\n--- the throttle actually spaces calls ---");
{
  const t0 = Date.now();
  await throttle("sec-edgar");
  await throttle("sec-edgar");
  await throttle("sec-edgar");
  const elapsed = Date.now() - t0;
  // Three calls = two gaps of >=150ms.
  check("three SEC calls take >= 300ms", elapsed >= 300, true);
  check("and are not absurdly slow (< 1s)", elapsed < 1000, true);
}

console.log("\n--- throttling is per-source, not global ---");
{
  const t0 = Date.now();
  await throttle("world-bank");
  await throttle("frankfurter");
  const elapsed = Date.now() - t0;
  // Different sources must not wait on each other.
  check("two different sources do not block each other", elapsed < 200, true);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
