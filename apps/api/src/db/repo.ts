/**
 * Data access — thin, typed queries over D1 via Drizzle. Routes call these;
 * nothing here formats or computes (that's src/domain).
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { FactMap } from "../domain/concepts";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema });
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
