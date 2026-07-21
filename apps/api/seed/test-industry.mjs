/**
 * Verifies the industry knowledge model (Atlas OS V1 Book 2).
 *
 * The behaviour that matters is the honest one: an under-researched industry
 * must SCORE LOW and name its gaps. A scorecard that flatters coverage is
 * worse than no scorecard — it hides exactly the work the manual exists to
 * direct.
 */
import {
  MANDATORY_SECTIONS,
  scoreCompleteness,
} from "../src/domain/industry-knowledge.ts";

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

const rec = (section, over = {}) => ({
  section, content: "x", kind: "fact", sourceUrl: "https://example.org",
  confidence: 1, asOf: "2026-07-21", ...over,
});

console.log("--- the schema is fixed at twenty sections ---");
check("mandatory section count", MANDATORY_SECTIONS.length, 20);
check("sections are unique", new Set(MANDATORY_SECTIONS).size, 20);

console.log("\n--- an empty industry scores zero and names every gap ---");
{
  const r = scoreCompleteness([]);
  check("completeness", r.completenessPct, 0);
  check("filled", r.filledCount, 0);
  check("every section reported missing", r.missingSections.length, 20);
  check("attribution is 0 when nothing is filled", r.attributionPct, 0);
}

console.log("\n--- partial coverage scores honestly ---");
{
  const r = scoreCompleteness([rec("overview"), rec("products"), rec("pricing"), rec("kpis"), rec("suppliers")]);
  check("5 of 20 filled", r.filledCount, 5);
  check("completeness is 25%", r.completenessPct, 25);
  check("gaps named", r.missingSections.length, 15);
  check("does NOT round up to look better", r.completenessPct < 30, true);
  check("gap list excludes filled sections", r.missingSections.includes("overview"), false);
}

console.log("\n--- source attribution is measured separately from coverage ---");
{
  // Both sections filled, but only one cites a source.
  const r = scoreCompleteness([rec("overview"), rec("products", { sourceUrl: null })]);
  check("both counted as filled", r.filledCount, 2);
  check("attribution is 50%, not 100%", r.attributionPct, 50);
  const unsourced = r.sections.find((s) => s.section === "products");
  check("the unsourced section is flagged", unsourced.sourced, false);
}

console.log("\n--- facts and assumptions stay separable (Book 2 quality rule) ---");
{
  const r = scoreCompleteness([
    rec("demand"),
    rec("demand", { kind: "assumption", confidence: 0.5 }),
  ]);
  const s = r.sections.find((x) => x.section === "demand");
  check("both records counted", s.recordCount, 2);
  check("assumptions counted separately", s.assumptions, 1);
  check("section takes the HIGHEST confidence", s.confidence, 1);
}

console.log("\n--- conflicting values are kept, not resolved ---");
{
  // Two different market-size claims from different sources.
  const r = scoreCompleteness([
    { ...rec("marketSize"), content: "USD 8bn", sourceUrl: "https://a.org", confidence: 0.9 },
    { ...rec("marketSize"), content: "USD 11bn", sourceUrl: "https://b.org", confidence: 0.6 },
  ]);
  const s = r.sections.find((x) => x.section === "marketSize");
  check("both conflicting records retained", s.recordCount, 2);
  check("section still counts once toward completeness", r.filledCount, 1);
}

console.log("\n--- a full industry reaches 100% ---");
{
  const r = scoreCompleteness(MANDATORY_SECTIONS.map((s) => rec(s)));
  check("completeness", r.completenessPct, 100);
  check("attribution", r.attributionPct, 100);
  check("no gaps", r.missingSections, []);
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
