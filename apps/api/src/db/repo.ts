/**
 * Data access — thin, typed queries over Postgres (Supabase) via Drizzle.
 * Routes call these; nothing here formats or computes (that's src/domain).
 *
 * The query builder is driver-agnostic, so these functions run unchanged on
 * postgres-js (production, over the Supabase pooler) and on PGlite (tests).
 */
import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import type { FactMap } from "../domain/concepts";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

export function createDb(client: Sql): Db {
  return drizzle(client, { schema });
}

export async function listCompanies(db: Db): Promise<schema.Company[]> {
  return db.select().from(schema.company).orderBy(asc(schema.company.name));
}

export async function getCompany(
  db: Db,
  id: string,
): Promise<schema.Company | undefined> {
  const rows = await db
    .select()
    .from(schema.company)
    .where(eq(schema.company.id, id))
    .limit(1);
  return rows[0];
}

export async function listIndustries(db: Db): Promise<schema.Industry[]> {
  return db.select().from(schema.industry).orderBy(asc(schema.industry.name));
}

export async function getIndustry(
  db: Db,
  id: string,
): Promise<schema.Industry | undefined> {
  const rows = await db
    .select()
    .from(schema.industry)
    .where(eq(schema.industry.id, id))
    .limit(1);
  return rows[0];
}

export async function listCompaniesByIndustry(
  db: Db,
  industryId: string,
): Promise<schema.Company[]> {
  return db
    .select()
    .from(schema.company)
    .where(eq(schema.company.industryId, industryId))
    .orderBy(asc(schema.company.name));
}

/** All relationships touching a company (either endpoint). */
export async function listRelationshipsFor(
  db: Db,
  companyId: string,
): Promise<schema.Relationship[]> {
  return db
    .select()
    .from(schema.relationship)
    .where(
      or(
        eq(schema.relationship.fromId, companyId),
        eq(schema.relationship.toId, companyId),
      ),
    );
}

export async function listAllRelationships(
  db: Db,
): Promise<schema.Relationship[]> {
  return db.select().from(schema.relationship);
}

/** Industry-level metric series (cost/price/capacity), oldest -> newest. */
export async function listIndustryMetrics(
  db: Db,
  industryId: string,
): Promise<schema.IndustryMetric[]> {
  return db
    .select()
    .from(schema.industryMetric)
    .where(eq(schema.industryMetric.industryId, industryId))
    .orderBy(
      asc(schema.industryMetric.metricKey),
      asc(schema.industryMetric.observationDate),
    );
}

export interface PeriodWithFacts {
  period: schema.FinancialPeriod;
  facts: FactMap;
}

/**
 * Load a company's periods of one type (oldest -> newest) with facts pivoted
 * into a FactMap per period. Two queries total — periods, then all facts for
 * those periods in one IN() — pivoted in JS (D1 round-trips dominate cost).
 */
export async function getPeriodsWithFacts(
  db: Db,
  companyId: string,
  periodType: "annual" | "quarter",
  limit?: number,
): Promise<PeriodWithFacts[]> {
  let periods = await db
    .select()
    .from(schema.financialPeriod)
    .where(
      and(
        eq(schema.financialPeriod.companyId, companyId),
        eq(schema.financialPeriod.periodType, periodType),
      ),
    )
    .orderBy(
      asc(schema.financialPeriod.fiscalYear),
      asc(schema.financialPeriod.fiscalQuarter),
    );

  if (limit !== undefined && periods.length > limit) {
    periods = periods.slice(periods.length - limit);
  }
  if (periods.length === 0) return [];

  const facts = await db
    .select()
    .from(schema.financialFact)
    .where(
      inArray(
        schema.financialFact.periodId,
        periods.map((p) => p.id),
      ),
    );

  const byPeriod = new Map<number, FactMap>();
  for (const f of facts) {
    const m = byPeriod.get(f.periodId) ?? {};
    m[f.concept] = f.value;
    byPeriod.set(f.periodId, m);
  }

  return periods.map((period) => ({
    period,
    facts: byPeriod.get(period.id) ?? {},
  }));
}

/**
 * Launch hardening: count an agent call for (ip, today) and return the new
 * total. The route compares it against the daily limit BEFORE calling Claude,
 * so over-limit requests never spend tokens.
 */
export async function recordAgentUse(db: Db, ip: string): Promise<number> {
  const rows = await db
    .insert(schema.agentUsage)
    .values({ ip, count: 1 })
    .onConflictDoUpdate({
      target: [schema.agentUsage.ip, schema.agentUsage.day],
      set: { count: sql`${schema.agentUsage.count} + 1` },
    })
    .returning({ count: schema.agentUsage.count });
  return rows[0]?.count ?? 1;
}
