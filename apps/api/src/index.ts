/**
 * Atlas API — Hono on Cloudflare Workers.
 *
 * Versioned under /v1. Response shapes mirror the frontend contracts in
 * apps/web (see docs/00-foundation/integration-points.md): the UI's loaders
 * call these endpoints through `apiFetch<T>` and hand results straight to
 * components — no reshaping client-side, no computation client-side.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import postgres from "postgres";
import { createDb } from "./db/repo";
import { companies } from "./routes/companies";
import { industries } from "./routes/industries";
import { scores } from "./routes/scores";
import { graph } from "./routes/graph";
import { agent } from "./routes/agent";

export interface Env {
  /**
   * Postgres connection string (Supabase). Use the Transaction pooler
   * (port 6543) for serverless. Set as a Worker secret; never in source.
   */
  DATABASE_URL: string;
  /** Anthropic API key for the agent (Worker secret; never in source). */
  ANTHROPIC_API_KEY?: string;
  /** Optional Claude model override for the agent. */
  AGENT_MODEL?: string;
  /**
   * Comma-separated list of allowed CORS origins (e.g. the Pages domain).
   * Unset ⇒ "*" so local dev and pre-config deploys keep working.
   */
  ALLOWED_ORIGINS?: string;
  /** Max /v1/agent/ask calls per IP per day (default 50). */
  AGENT_DAILY_LIMIT?: string;
}

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

const app = new Hono<AppEnv>();

// The web app is a static Cloudflare Pages site on a different origin. In
// production set ALLOWED_ORIGINS (comma-separated) to the Pages domain(s);
// when unset (local dev, pre-config deploys) the policy stays permissive.
app.use("*", async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS;
  const handler = cors({
    origin: allowed
      ? (origin) =>
          allowed
            .split(",")
            .map((s) => s.trim())
            .includes(origin)
            ? origin
            : undefined
      : "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  });
  return handler(c, next);
});

// One Postgres connection per request over the Supabase transaction pooler.
// `prepare: false` is required for transaction-pooling mode; the connection is
// closed after the response via waitUntil so it never blocks the reply.
app.use("*", async (c, next) => {
  const client = postgres(c.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    idle_timeout: 10,
    fetch_types: false,
  });
  c.set("db", createDb(client));
  try {
    await next();
  } finally {
    // Close the connection without blocking the response when running on
    // Workers (executionCtx present); otherwise await it. The getter throws
    // when there is no ExecutionContext, so guard with try/catch.
    try {
      c.executionCtx.waitUntil(client.end({ timeout: 5 }));
    } catch {
      await client.end({ timeout: 5 });
    }
  }
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "atlas-api", version: "0.1.0" }),
);

app.route("/v1/companies", companies);
app.route("/v1/industries", industries);
app.route("/v1/scores", scores);
app.route("/v1/graph", graph);
app.route("/v1/agent", agent);

app.notFound((c) =>
  c.json({ error: "The requested resource was not found." }, 404),
);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "The request could not be completed." }, 500);
});

export default app;
