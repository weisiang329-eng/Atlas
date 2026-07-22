/**
 * /v1/graph — the knowledge graph (P007).
 *
 * GET /               the full universe graph (nodes + edges)
 * GET /company/:id    one company's ego graph + relations list
 */
import { Hono } from "hono";
import type { Env } from "../index.ts";
import {
  createDb,
  getCompany,
  listAllRelationships,
  listCompanies,
  listRelationshipsFor,
} from "../db/repo.ts";
import { buildEgoGraph, buildFullGraph } from "../domain/graph.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const graph = new Hono<AppEnv>();

graph.get("/", async (c) => {
  const db = c.get("db");
  const [companies, rels] = await Promise.all([
    listCompanies(db),
    listAllRelationships(db),
  ]);
  return c.json(buildFullGraph(companies, rels));
});

graph.get("/company/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const [subject, companies, rels] = await Promise.all([
    getCompany(db, id),
    listCompanies(db),
    listRelationshipsFor(db, id),
  ]);
  if (!subject) return c.json({ error: "Company not found." }, 404);
  const nameOf = (cid: string) =>
    companies.find((co) => co.id === cid)?.name ?? cid;
  return c.json(buildEgoGraph(subject, rels, nameOf));
});
