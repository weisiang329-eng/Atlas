/**
 * Verifies the self-applying migrator against real Postgres (PGlite).
 *
 * The behaviour that matters is the awkward one: Atlas's database was
 * provisioned by hand before the Worker could migrate itself, so the migrator
 * must ADOPT an existing schema rather than crash on it — drizzle emits bare
 * CREATE TABLE, which fails on a second run.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const read = (p) => readFileSync(`./${p}`, "utf8");
const MIGRATIONS = [
  { id: "0000_init_postgres", sql: read("drizzle/0000_init_postgres.sql"), sentinel: "company" },
  { id: "0001_agent_usage", sql: read("drizzle/0001_agent_usage.sql"), sentinel: "agent_usage" },
  { id: "0002_pms", sql: read("drizzle/0002_pms.sql"), sentinel: "pms_trade" },
  { id: "0003_agent_console", sql: read("drizzle/0003_agent_console.sql"), sentinel: "agent_run" },
];

let failures = 0;
const check = (label, actual, expected) => {
  const ok = typeof expected === "function" ? expected(actual) : JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "✓" : "✗"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) failures += 1;
};

/** Mirror of src/db/migrate.ts run(). */
async function migrate(db) {
  const applied = [], baselined = [];
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = (await db.query("SELECT id FROM schema_migrations")).rows.map((r) => r.id);
  const already = new Set(done);
  for (const m of MIGRATIONS) {
    if (already.has(m.id)) continue;
    const present = (await db.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS ex`,
      [m.sentinel],
    )).rows[0].ex;
    if (present) {
      await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
      baselined.push(m.id);
      continue;
    }
    await db.exec(m.sql);
    await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
    applied.push(m.id);
  }
  return { applied, baselined };
}

console.log("--- fresh database: everything applies ---");
{
  const db = new PGlite();
  const r = await migrate(db);
  check("all migrations applied", r.applied, ["0000_init_postgres", "0001_agent_usage", "0002_pms", "0003_agent_console"]);
  check("nothing baselined", r.baselined, []);
  check("pms tables exist",
    (await db.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_name LIKE 'pms_%'")).rows[0].n,
    (n) => n >= 8);
  await db.close();
}

console.log("\n--- second run is a no-op (INVARIANT) ---");
{
  const db = new PGlite();
  await migrate(db);
  const r = await migrate(db);
  check("nothing applied again", r.applied, []);
  check("nothing baselined again", r.baselined, []);
  check("no duplicate migration rows",
    (await db.query("SELECT count(*)::int n FROM schema_migrations")).rows[0].n, 4);
  await db.close();
}

console.log("\n--- ADOPTING a hand-provisioned database (Atlas's real case) ---");
{
  const db = new PGlite();
  // Simulate production: 0000 and 0001 applied by hand, no schema_migrations.
  await db.exec(read("drizzle/0000_init_postgres.sql"));
  await db.exec(read("drizzle/0001_agent_usage.sql"));
  check("no migration ledger yet",
    (await db.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='schema_migrations') AS ex")).rows[0].ex,
    false);

  const r = await migrate(db);
  check("existing schema is BASELINED, not re-run", r.baselined, ["0000_init_postgres", "0001_agent_usage"]);
  check("only the genuinely new migrations run", r.applied, ["0002_pms", "0003_agent_console"]);
  check("existing data survives untouched",
    (await db.query("SELECT count(*)::int n FROM company")).rows[0].n, 0);
  check("new pms tables now exist",
    (await db.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='pms_trade') AS ex")).rows[0].ex,
    true);

  const again = await migrate(db);
  check("and a further run stays a no-op", [...again.applied, ...again.baselined], []);
  await db.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}`);
process.exit(failures === 0 ? 0 : 1);
