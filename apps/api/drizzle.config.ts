import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config — schema-first migrations for Postgres (Supabase).
 *
 * `drizzle-kit generate` reads the schema and emits SQL migrations into
 * ./drizzle. Those migrations are applied to Supabase by running the SQL in
 * the Supabase SQL editor (or via psql), see the production runbook — the
 * Worker has no long-lived connection for drizzle-kit to push over.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
} satisfies Config;
