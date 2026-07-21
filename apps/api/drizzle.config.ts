import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit config — schema-first migrations for D1 (SQLite).
 *
 * `drizzle-kit generate` reads the schema and emits SQL migrations into
 * ./drizzle. Those migrations are applied to D1 by Wrangler (see the
 * db:migrate:* scripts in package.json), not by Drizzle directly — D1 has no
 * long-lived connection for Drizzle to push over.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
} satisfies Config;
