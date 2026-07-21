/**
 * Generates graph-seed.sql from relationships.mjs (P007 v1). Idempotent
 * (INSERT OR REPLACE on the from/to/type unique key); one source row records
 * the industry-structure provenance.
 *
 *   node seed/graph/generate.mjs
 *   wrangler d1 execute atlas-db --local --file=seed/graph/graph-seed.sql
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RELATIONSHIPS } from "./relationships.mjs";
import { HEADER, q, upsert } from "../pg.mjs";

const SOURCE_ID = "graph-industry-structure";
const lines = [HEADER("seed/graph/generate.mjs")];
lines.push(
  upsert(
    "source",
    {
      id: q(SOURCE_ID),
      kind: q("manual"),
      name: q("Publicly-known industry structure (supply chain + competition)"),
      url: q(null),
      retrieved_at: q("2026-07-21"),
      note: q("Supply-chain and competitive edges between covered companies, from public company disclosures and industry reporting. Edges only between companies Atlas covers."),
    },
    ["id"],
    ["kind", "name", "url", "retrieved_at", "note"],
  ),
);

for (const r of RELATIONSHIPS) {
  lines.push(
    upsert(
      "relationship",
      {
        from_id: q(r.from),
        to_id: q(r.to),
        relation_type: q(r.type),
        label: q(r.label),
        note: q(r.note),
        source_id: q(SOURCE_ID),
      },
      ["from_id", "to_id", "relation_type"],
      ["label", "note", "source_id"],
    ),
  );
}

const out = join(dirname(fileURLToPath(import.meta.url)), "graph-seed.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${out}: ${RELATIONSHIPS.length} relationships.`);
