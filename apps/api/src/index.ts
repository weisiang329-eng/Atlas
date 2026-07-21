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
import { createDb } from "./db/repo";
import { companies } from "./routes/companies";
import { industries } from "./routes/industries";
import { scores } from "./routes/scores";

export interface Env {
  DB: D1Database;
}

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

const app = new Hono<AppEnv>();

// The web app is a static Cloudflare Pages site on a different origin; the API
// is public read-only data, so a permissive CORS policy is acceptable for now.
// Revisit when write endpoints or auth land.
app.use("*", cors({ origin: "*", allowMethods: ["GET", "OPTIONS"] }));

app.use("*", async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});

app.get("/health", (c) =>
  c.json({ status: "ok", service: "atlas-api", version: "0.1.0" }),
);

app.route("/v1/companies", companies);
app.route("/v1/industries", industries);
app.route("/v1/scores", scores);

app.notFound((c) =>
  c.json({ error: "The requested resource was not found." }, 404),
);

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "The request could not be completed." }, 500);
});

export default app;
