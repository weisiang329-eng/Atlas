/**
 * /v1/industries/:id/knowledge — the Industry Research Analyst's output.
 *
 * The response leads with the COMPLETENESS SCORECARD rather than the content,
 * because Book 2's operating discipline is that gaps are the work: an industry
 * scoring 40% tells the analyst exactly what to research next, while a page
 * that only showed what it had would hide that.
 */
import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import type { Env } from "../index.ts";
import { createDb } from "../db/repo.ts";
import { industryKnowledge, industryKpi } from "../db/schema.ts";
import {
  scoreCompleteness,
  type KnowledgeRecord,
} from "../domain/industry-knowledge.ts";

type AppEnv = { Bindings: Env; Variables: { db: ReturnType<typeof createDb> } };

export const industryKnowledgeRoutes = new Hono<AppEnv>();

industryKnowledgeRoutes.get("/:id/knowledge", async (c) => {
  const db = c.get("db");
  const industryId = c.req.param("id");

  const [records, kpis] = await Promise.all([
    db
      .select()
      .from(industryKnowledge)
      .where(eq(industryKnowledge.industryId, industryId))
      .orderBy(asc(industryKnowledge.section)),
    db
      .select()
      .from(industryKpi)
      .where(eq(industryKpi.industryId, industryId))
      .orderBy(asc(industryKpi.key)),
  ]);

  const asRecords: KnowledgeRecord[] = records.map((r) => ({
    section: r.section,
    content: r.content,
    kind: r.kind,
    sourceUrl: r.sourceUrl,
    confidence: r.confidence,
    asOf: r.asOf,
  }));

  const report = scoreCompleteness(asRecords);

  // Group content by section so the UI never has to filter, and so an empty
  // section is explicitly an empty array rather than an absent key.
  const bySection: Record<string, KnowledgeRecord[]> = {};
  for (const s of report.sections) bySection[s.section] = [];
  for (const r of asRecords) {
    (bySection[r.section] ??= []).push(r);
  }

  return c.json({
    industryId,
    completeness: report,
    sections: bySection,
    kpis,
  });
});
