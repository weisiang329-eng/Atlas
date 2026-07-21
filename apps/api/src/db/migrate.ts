/**
 * Self-applying schema migrations.
 *
 * The Worker already holds `DATABASE_URL`, so it can bring the database up to
 * date itself. Before this, every new table meant someone pasting SQL into the
 * Supabase dashboard by hand — slow, easy to forget, and it made the deployed
 * code and the deployed schema drift apart silently.
 *
 * Design:
 * - Migrations are bundled as text modules (see wrangler.toml `[[rules]]`), so
 *   the SQL that ships is exactly the SQL in the repo.
 * - `schema_migrations` records what has run. Each migration runs at most once.
 * - A transaction-scoped advisory lock serialises concurrent Workers, so two
 *   cold starts racing cannot apply the same migration twice.
 * - Everything runs inside one transaction: a migration lands whole or not at
 *   all, and never leaves the schema half-built.
 * - Already-provisioned schemas are BASELINED, not re-run (see MIGRATIONS).
 * - The result is cached per Worker instance, so this costs one cheap query on
 *   a cold start and nothing thereafter.
 */
import type { Sql } from "postgres";

import init0000 from "../../drizzle/0000_init_postgres.sql";
import agentUsage0001 from "../../drizzle/0001_agent_usage.sql";
import pms0002 from "../../drizzle/0002_pms.sql";

/**
 * Ordered. Never renumber or edit a shipped migration — append a new one.
 *
 * `sentinel` is a table the migration creates. It exists to BASELINE an
 * already-provisioned database: this schema was applied by hand before the
 * Worker could migrate itself, so `schema_migrations` starts empty against a
 * database that is in fact up to date. Re-running those files would fail —
 * drizzle emits bare `CREATE TABLE` / `CREATE INDEX`, not `IF NOT EXISTS`.
 * So if the sentinel is already present, the migration is recorded as applied
 * rather than executed. (Flyway calls this baselining; the alternative is
 * asking a human to fix it up once, which is exactly what this removes.)
 */
const MIGRATIONS: { id: string; sql: string; sentinel: string }[] = [
  { id: "0000_init_postgres", sql: init0000, sentinel: "company" },
  { id: "0001_agent_usage", sql: agentUsage0001, sentinel: "agent_usage" },
  { id: "0002_pms", sql: pms0002, sentinel: "pms_trade" },
];

/** Arbitrary but fixed — the lock key every Atlas Worker agrees on. */
const LOCK_KEY = 8214_2026;

export interface MigrationReport {
  /** Migrations executed against the database by this Worker. */
  applied: string[];
  /** Migrations found already provisioned and simply recorded. */
  baselined: string[];
}

let settled: Promise<MigrationReport> | null = null;

async function run(client: Sql): Promise<MigrationReport> {
  const applied: string[] = [];
  const baselined: string[] = [];

  // Everything inside ONE transaction, holding a transaction-scoped advisory
  // lock. Session-scoped locks (pg_advisory_lock) are wrong here: Supabase's
  // transaction pooler hands the same backend to different clients between
  // statements, so a session lock can outlive its owner or be released by a
  // stranger. `pg_advisory_xact_lock` is released at COMMIT, which the pooler
  // respects. Postgres DDL is transactional, so a failed migration rolls back
  // whole rather than leaving the schema half-built.
  await client.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
    await tx`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          text PRIMARY KEY,
        applied_at  timestamptz NOT NULL DEFAULT now()
      )
    `;

    const done = await tx<{ id: string }[]>`SELECT id FROM schema_migrations`;
    const already = new Set(done.map((r) => r.id));

    for (const m of MIGRATIONS) {
      if (already.has(m.id)) continue;

      const [present] = await tx<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = ${m.sentinel}
        ) AS exists
      `;

      if (present?.exists) {
        // Already provisioned by hand — record it, do not re-run it.
        await tx`INSERT INTO schema_migrations (id) VALUES (${m.id})`;
        baselined.push(m.id);
        continue;
      }

      await tx.unsafe(m.sql);
      await tx`INSERT INTO schema_migrations (id) VALUES (${m.id})`;
      applied.push(m.id);
    }
  });

  return { applied, baselined };
}

/**
 * Bring the schema up to date. Safe to call on every request: the work happens
 * once per Worker instance, and the migrations themselves are idempotent.
 */
export function ensureSchema(client: Sql): Promise<MigrationReport> {
  settled ??= run(client).catch((err) => {
    // Never cache a failure — a transient connection error must not leave the
    // instance permanently convinced the schema is unmigratable.
    settled = null;
    throw err;
  });
  return settled;
}

/** Migration ids known to this build — surfaced by /health for diagnosis. */
export const MIGRATION_IDS = MIGRATIONS.map((m) => m.id);
