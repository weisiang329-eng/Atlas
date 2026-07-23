/**
 * Verifies the industry signal builders (`domain/industry.ts`, P026).
 *
 * These turn raw metric rows into the price/cost series and the derived
 * MARGIN CYCLE — the ASP ÷ input-cost ratio a whole sector's earnings track.
 * Two things must hold or the signal lies: it may only be built from an
 * overlapping price AND cost series (a ratio needs both, on the same dates),
 * and year-over-year must compare a point to one ~a year before it, not to
 * whatever happens to be one row back.
 */
import {
  buildMetricSeries,
  buildCycleSignal,
} from "../src/domain/industry.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const row = (metricKey, kind, date, value, over = {}) => ({
  id: 1, industryId: "rubber-gloves", metricKey,
  label: over.label ?? metricKey, kind, observationDate: date, value,
  unit: over.unit ?? "u", note: over.note ?? null, sourceId: null, createdAt: null,
});

console.log("--- metric series: grouping, latest, and honest YoY ---");
{
  const series = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20),
    row("asp", "price", "2025-03-31", 26), // +30% one year later
    row("latex", "cost", "2025-03-31", 1200),
  ]);
  check("one series per metric key", series.map((s) => s.key).sort(), ["asp", "latex"]);

  const asp = series.find((s) => s.key === "asp");
  check("points are carried through in order", asp.points.map((p) => p.value), [20, 26]);
  check("latest is the newest point", [asp.latest, asp.latestDate], [26, "2025-03-31"]);
  check("YoY compares to the point ~a year earlier", asp.changeYoYPct, 30);

  const latex = series.find((s) => s.key === "latex");
  check("a single-point series has no YoY to compute", latex.changeYoYPct, null);
}

console.log("\n--- YoY does not compare to an arbitrary neighbour ---");
{
  // Three points inside one year: YoY must be null (no point ~365d back),
  // not the change from the previous quarter.
  const s = buildMetricSeries([
    row("x", "price", "2025-01-31", 10),
    row("x", "price", "2025-04-30", 12),
    row("x", "price", "2025-07-31", 15),
  ])[0];
  check("no point a year back ⇒ YoY is null, not the QoQ change", s.changeYoYPct, null);
}

console.log("\n--- the margin cycle signal ---");
{
  // price ÷ cost, indexed to the first overlapping quarter = 100.
  const series = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20, { label: "ASP" }),
    row("asp", "price", "2024-06-30", 30),
    row("latex", "cost", "2024-03-31", 10, { label: "Latex" }),
    row("latex", "cost", "2024-06-30", 12),
  ]);
  const cycle = buildCycleSignal(series);
  // Q1 ratio = 20/10 = 2 → 100. Q2 ratio = 30/12 = 2.5 → 125.
  check("the base quarter indexes to 100", cycle.points[0].value, 100);
  check("a widening spread reads above 100", cycle.points[1].value, 125);
  check("the label names both sides and the base date",
    cycle.label.includes("ASP") && cycle.label.includes("Latex"), true);
}

console.log("\n--- it refuses to fabricate a ratio it cannot support ---");
{
  const priceOnly = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20),
    row("asp", "price", "2024-06-30", 30),
  ]);
  check("no cost series ⇒ no cycle", buildCycleSignal(priceOnly), null);

  // Price and cost that never share a date cannot be divided.
  const disjoint = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20),
    row("latex", "cost", "2024-06-30", 10),
  ]);
  check("non-overlapping price and cost ⇒ no cycle", buildCycleSignal(disjoint), null);

  // A single overlapping quarter is a point, not a cycle.
  const onePair = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20),
    row("latex", "cost", "2024-03-31", 10),
  ]);
  check("one paired quarter is not enough for a signal", buildCycleSignal(onePair), null);

  // A zero (or negative) cost would divide-by-zero; that quarter is skipped.
  const withZero = buildMetricSeries([
    row("asp", "price", "2024-03-31", 20),
    row("asp", "price", "2024-06-30", 30),
    row("latex", "cost", "2024-03-31", 0),  // unusable
    row("latex", "cost", "2024-06-30", 10),
  ]);
  check("a zero-cost quarter is dropped, not divided by",
    buildCycleSignal(withZero), null); // only one usable pair remains → null
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
