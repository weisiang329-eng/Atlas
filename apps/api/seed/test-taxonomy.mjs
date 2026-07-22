/**
 * Verifies the industry taxonomy — the tree itself and the roll-up over it.
 *
 * Two classes of failure this must catch:
 *
 * 1. **A broken tree.** An unresolvable parent, a cycle, or a `level` that
 *    disagrees with actual depth. Any of those renders a breadcrumb that lies
 *    about where a reader is standing, and drivers hang off this tree.
 * 2. **A parent that reads as empty.** Companies are filed on leaves, so
 *    without roll-up 半导体 shows zero companies while its children hold the
 *    whole universe — the exact failure that makes a taxonomy feel useless.
 *
 * It also pins the DATABASE against `seed/taxonomy.mjs`, which is the written
 * source of truth (docs/INDUSTRY-INTELLIGENCE.md §1). Editing the taxonomy
 * without shipping a migration fails here rather than silently diverging.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import {
  buildTaxonomy,
  descendantIds,
  pathOf,
  rollUpMembers,
} from "../src/domain/taxonomy.ts";
import { TAXONOMY } from "./taxonomy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const api = join(here, "..");
const read = (p) => readFileSync(join(api, p), "utf8");

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

console.log("--- paths, descendants, roll-up (pure) ---");
{
  const rows = [
    { id: "tech", name: "Technology", nameZh: "科技", parentId: null, level: 1 },
    { id: "semis", name: "Semiconductors", nameZh: "半导体", parentId: "tech", level: 2 },
    { id: "memory", name: "Memory", nameZh: "存储", parentId: "semis", level: 3 },
    { id: "dram", name: "DRAM", nameZh: "DRAM", parentId: "memory", level: 4 },
    { id: "hbm", name: "HBM", nameZh: "HBM", parentId: "memory", level: 4 },
    { id: "power", name: "Power", nameZh: "电力", parentId: "tech", level: 2 },
  ];

  check("path is root → node, in order", pathOf(rows, "dram").map((n) => n.id), ["tech", "semis", "memory", "dram"]);
  check("a root's path is itself", pathOf(rows, "tech").map((n) => n.id), ["tech"]);
  check("an unknown id yields no path", pathOf(rows, "nope"), []);
  check("descendants include the node itself", [...descendantIds(rows, "memory")].sort(), ["dram", "hbm", "memory"]);
  check("a leaf descends only to itself", [...descendantIds(rows, "dram")], ["dram"]);

  const tree = buildTaxonomy(rows);
  check("one root", tree.map((n) => n.id), ["tech"]);
  check("children nest", tree[0].children.map((n) => n.id).sort(), ["power", "semis"]);

  // The property the whole roll-up exists for.
  const companies = [
    { id: "micron", industryId: "dram" },
    { id: "skhynix", industryId: "hbm" },
    { id: "vertiv", industryId: "power" },
    { id: "unfiled", industryId: null },
  ];
  const members = rollUpMembers(rows, companies);
  check("a leaf holds its own", members.get("dram"), ["micron"]);
  check("a parent inherits every descendant", members.get("memory").sort(), ["micron", "skhynix"]);
  check("the root sees the whole universe", members.get("tech").sort(), ["micron", "skhynix", "vertiv"]);
  check("a company filed nowhere is counted nowhere", members.get("semis"), ["micron", "skhynix"]);
}

console.log("\n--- a broken tree must not hang or lie ---");
{
  // A cycle is a data bug, but an infinite loop in a Worker is an outage.
  const cyclic = [
    { id: "a", name: "A", nameZh: null, parentId: "b", level: 1 },
    { id: "b", name: "B", nameZh: null, parentId: "a", level: 2 },
  ];
  check("a cycle terminates", pathOf(cyclic, "a").length, (v) => v <= 2);
  check("a cycle does not duplicate descendants", [...descendantIds(cyclic, "a")].sort(), ["a", "b"]);

  const orphan = [{ id: "x", name: "X", nameZh: null, parentId: "missing", level: 2 }];
  check("an unresolvable parent renders as a root, never dropped", buildTaxonomy(orphan).map((n) => n.id), ["x"]);
}

console.log("\n--- the database matches the written taxonomy ---");
{
  const db = new PGlite();
  for (const m of [
    "drizzle/0000_init_postgres.sql",
    "drizzle/0007_industry_tree.sql",
    "drizzle/0010_fiscal_year_end.sql",
  ]) {
    await db.exec(read(m));
  }
  // Replay proves idempotency: the Worker re-runs migrations on any database
  // whose schema_migrations row is missing.
  await db.exec(read("drizzle/0007_industry_tree.sql"));
  for (const s of ["seed/seed.sql", "seed/glove/glove-seed.sql"]) {
    await db.exec(read(s));
  }

  const rows = (await db.query(
    "SELECT id, name, name_zh AS \"nameZh\", parent_id AS \"parentId\", level FROM industry ORDER BY id",
  )).rows;

  check("every taxonomy node exists exactly once", rows.length, TAXONOMY.length);

  const byId = new Map(rows.map((r) => [r.id, r]));
  const missing = TAXONOMY.filter((t) => !byId.has(t.id)).map((t) => t.id);
  check("no node from taxonomy.mjs is missing", missing, []);

  const misplaced = TAXONOMY.filter((t) => {
    const row = byId.get(t.id);
    return !row || row.parentId !== t.parentId || row.level !== t.level || row.nameZh !== t.nameZh;
  }).map((t) => t.id);
  check("parent, level and Chinese name match the source of truth", misplaced, []);

  // Depth is COMPUTED here, not read: a level column that disagrees with the
  // parent chain would produce a breadcrumb of the wrong length.
  const wrongDepth = rows
    .filter((r) => pathOf(rows, r.id).length !== r.level)
    .map((r) => r.id);
  check("stored level equals computed depth for every node", wrongDepth, []);

  const dangling = rows
    .filter((r) => r.parentId !== null && !byId.has(r.parentId))
    .map((r) => r.id);
  check("no dangling parent", dangling, []);
  check("exactly two roots", rows.filter((r) => r.parentId === null).map((r) => r.id).sort(), ["sector-healthcare", "sector-technology"]);

  // Nothing is filed on an interior node by accident, and the seven original
  // industries still hold every company (leaf re-filing is a separate,
  // owner-reviewed decision — see HANDOFF).
  const companies = (await db.query('SELECT id, industry_id AS "industryId" FROM company')).rows;
  const members = rollUpMembers(rows, companies);
  check("17 companies seeded", companies.length, 17);
  check("科技 rolls up 10", members.get("sector-technology").length, 10);
  check("半导体 rolls up 7", members.get("chain-semiconductors").length, 7);
  check("AI 基础设施 rolls up 3", members.get("chain-ai-infrastructure").length, 3);
  check("医疗保健 rolls up 7", members.get("sector-healthcare").length, 7);
  check("存储 rolls up its 2 makers", members.get("semis-memory").length, 2);
  check("DRAM has no company filed on it yet", members.get("memory-dram").length, 0);

  const breadcrumb = pathOf(rows, "memory-dram").map((n) => n.nameZh).join(" › ");
  check("the breadcrumb reads as designed", breadcrumb, "科技 › 半导体 › 存储 › DRAM");

  await db.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
