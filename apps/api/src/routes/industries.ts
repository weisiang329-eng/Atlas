/**
 * /v1/industries — the industry taxonomy (Atlas Invest coverage map).
 */
import { Hono } from "hono";
import type { Env } from "../index";
import { createDb, listIndustries } from "../db/repo";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const industries = new Hono<AppEnv>();

industries.get("/", async (c) => {
  const rows = await listIndustries(c.get("db"));
  return c.json(rows);
});
