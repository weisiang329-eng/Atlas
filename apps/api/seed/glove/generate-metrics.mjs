/**
 * Generates industry-metrics.sql from industry-metrics.json (P026 Phase 2).
 *
 * Attaches the MARGMA glove ASP + NBR latex cost series to the rubber-gloves
 * industry, each point carrying its own note; one source row records the
 * glove-tracker provenance. Idempotent (INSERT OR REPLACE on the
 * industry/metric/date unique key).
 *
 *   node seed/glove/generate-metrics.mjs
 *   wrangler d1 execute atlas-db --local --file=seed/glove/industry-metrics.sql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HEADER, n, q, upsert } from "../pg.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const { provenance, series } = JSON.parse(
  readFileSync(join(here, "industry-metrics.json"), "utf8"),
);

const INDUSTRY_ID = "rubber-gloves";
const SOURCE_ID = "glove-tracker-industry";

const lines = [HEADER("seed/glove/generate-metrics.mjs")];
lines.push(
  upsert(
    "source",
    {
      id: q(SOURCE_ID),
      kind: q("glove-tracker"),
      name: q("glove-tracker industry benchmarks (MARGMA ASP, NBR latex)"),
      url: q("https://margma.com.my/"),
      retrieved_at: q("2026-04-20"),
      note: q(provenance),
    },
    ["id"],
    ["kind", "name", "url", "retrieved_at", "note"],
  ),
);

let points = 0;
for (const s of series) {
  for (const p of s.points) {
    lines.push(
      upsert(
        "industry_metric",
        {
          industry_id: q(INDUSTRY_ID),
          metric_key: q(s.metricKey),
          label: q(s.label),
          kind: q(s.kind),
          observation_date: q(p.date),
          value: n(p.value),
          unit: q(p.unit),
          note: q(p.note),
          source_id: q(SOURCE_ID),
        },
        ["industry_id", "metric_key", "observation_date"],
        ["label", "kind", "value", "unit", "note", "source_id"],
      ),
    );
    points += 1;
  }
}

const out = join(here, "industry-metrics.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${out}: ${series.length} series, ${points} points.`);
