/**
 * The sourced-write guard — the one thing standing between an autonomous agent
 * and convention #1. It must be impossible for a Tier-A metric write to land a
 * value that is not in the fetched source, or to write from a paid/untrusted
 * source. These assertions are that guarantee, verified directly.
 *
 * See adr/ADR-Autonomous-Industry-Agent.md and src/agent/sourced-writes.ts.
 */
import {
  isWritableSource,
  numbersIn,
  contentSupports,
  metricWriteFromReceipt,
  FabricationGuardError,
} from "../src/agent/sourced-writes.ts";
import { DATA_SOURCES } from "../src/ingest/sources.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok =
    typeof expected === "function"
      ? expected(actual)
      : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};
const throws = (label, fn, ErrType) => {
  let threw = null;
  try {
    fn();
  } catch (e) {
    threw = e;
  }
  const ok = threw instanceof ErrType;
  console.log(`${ok ? "✓" : "✗"} ${label}: ${threw ? threw.name : "did not throw"}`);
  if (!ok) failures += 1;
};

console.log("--- the writable-source allowlist (paid can never be written) ---");
{
  // Derived from the real registry: writable IFF status is connected/awaiting-key.
  const wrong = DATA_SOURCES.filter(
    (s) =>
      isWritableSource(s.id) !==
      (s.status === "connected" || s.status === "awaiting-key"),
  );
  check("allowlist matches the status rule for every registered source", wrong.map((s) => s.id), []);
  check("SEC EDGAR (free, connected) is writable", isWritableSource("sec-edgar"), true);
  check("TrendForce (paid) is NOT writable", isWritableSource("trendforce"), false);
  check("an unknown source id is NOT writable", isWritableSource("made-up"), false);
}

console.log("\n--- number extraction tolerates real-world formatting ---");
{
  check("plain integer found", numbersIn("Wafer starts: 12345 units").includes(12345), true);
  check("thousands separators normalised", numbersIn("Revenue was 1,234,567 last quarter").includes(1234567), true);
  check("decimals kept", numbersIn("ASP fell to 24.7 cents").includes(24.7), true);
  check("negatives kept", numbersIn("Change of -3.2%").includes(-3.2), true);
}

console.log("\n--- contentSupports: the guard proper ---");
{
  check("value present (exact) is supported", contentSupports("The index printed 42 today", 42), true);
  check("value present with commas is supported", contentSupports("Total 1,204,000 tonnes", 1204000), true);
  check("value present as a decimal is supported", contentSupports("Copper $8,912.50/t", 8912.5), true);
  check("value ABSENT is NOT supported", contentSupports("The index printed 42 today", 99), false);
  check("empty content supports nothing", contentSupports("", 1), false);
}

console.log("\n--- metricWriteFromReceipt: rows out, or a guard error ---");
{
  const receipt = { sourceId: "sec-edgar", kind: "sec-edgar", url: "https://data.sec.gov/x", retrievedAt: "2026-07-23T00:00:00Z" };
  const base = {
    receipt,
    content: "Reported inventory of 5,120 million and other lines.",
    industryId: "semis-memory",
    metricKey: "test_metric",
    label: "Test metric",
    kind: "capacity",
    unit: "USD millions",
    observationDate: "2026-03-31",
    value: 5120,
  };

  const out = metricWriteFromReceipt(base);
  check("a sourced value produces a source row of the receipt's kind", out.source.kind, "sec-edgar");
  check("the metric links to that source row", out.metric.sourceId, out.source.id);
  check("the metric carries the transcribed value", out.metric.value, 5120);
  check("the source records where it came from", out.source.url, "https://data.sec.gov/x");

  // THE property: a value not in the fetched content is refused.
  throws(
    "an unsourced value is refused",
    () => metricWriteFromReceipt({ ...base, value: 9999 }),
    FabricationGuardError,
  );

  // And a paid source can never be written from, even if the value is present.
  throws(
    "a write from a paid source is refused",
    () => metricWriteFromReceipt({ ...base, receipt: { ...receipt, sourceId: "trendforce" } }),
    FabricationGuardError,
  );
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
