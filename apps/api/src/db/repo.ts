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
import type { FactMap } from "../domain/concepts.ts";
import * as schema from "./schema.ts";

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

/* ═══════════════════════════════════════════════════════════════════════
 * Portfolio accounting (PMS) — docs/PORTFOLIO-ACCOUNTING.md
 * Trades are append-only; lots and closures are written by the matcher.
 * ═══════════════════════════════════════════════════════════════════════ */

export async function ensureAccount(
  db: Db,
  account: { id: string; name: string; broker: string; baseCurrency?: string },
): Promise<schema.PmsAccount> {
  const rows = await db
    .insert(schema.pmsAccount)
    .values({
      id: account.id,
      name: account.name,
      broker: account.broker,
      baseCurrency: account.baseCurrency ?? "MYR",
    })
    .onConflictDoUpdate({
      target: schema.pmsAccount.id,
      set: { name: account.name, broker: account.broker },
    })
    .returning();
  return rows[0]!;
}

export async function ensureInstrument(
  db: Db,
  inst: {
    id: string;
    symbol: string;
    market: "US" | "MY" | "HK" | "SG";
    currency: string;
    name: string;
  },
): Promise<schema.PmsInstrument> {
  const rows = await db
    .insert(schema.pmsInstrument)
    .values(inst)
    .onConflictDoUpdate({
      target: schema.pmsInstrument.id,
      set: { name: inst.name, currency: inst.currency },
    })
    .returning();
  return rows[0]!;
}

export async function listTrades(
  db: Db,
  accountId: string,
): Promise<schema.PmsTrade[]> {
  return db
    .select()
    .from(schema.pmsTrade)
    .where(eq(schema.pmsTrade.accountId, accountId))
    .orderBy(asc(schema.pmsTrade.tradedAt), asc(schema.pmsTrade.id));
}

export async function insertTrade(
  db: Db,
  trade: typeof schema.pmsTrade.$inferInsert,
): Promise<schema.PmsTrade> {
  const rows = await db.insert(schema.pmsTrade).values(trade).returning();
  return rows[0]!;
}

export async function insertTradeFees(
  db: Db,
  fees: (typeof schema.pmsTradeFee.$inferInsert)[],
): Promise<void> {
  if (fees.length === 0) return;
  await db.insert(schema.pmsTradeFee).values(fees);
}

export async function listTradeFees(
  db: Db,
  tradeIds: number[],
): Promise<schema.PmsTradeFee[]> {
  if (tradeIds.length === 0) return [];
  return db
    .select()
    .from(schema.pmsTradeFee)
    .where(inArray(schema.pmsTradeFee.tradeId, tradeIds));
}

export async function insertLot(
  db: Db,
  lot: typeof schema.pmsLot.$inferInsert,
): Promise<schema.PmsLot> {
  const rows = await db.insert(schema.pmsLot).values(lot).returning();
  return rows[0]!;
}

/** Open lots for one instrument, oldest first — the matcher's input. */
export async function listOpenLots(
  db: Db,
  accountId: string,
  instrumentId: string,
): Promise<schema.PmsLot[]> {
  return db
    .select()
    .from(schema.pmsLot)
    .where(
      and(
        eq(schema.pmsLot.accountId, accountId),
        eq(schema.pmsLot.instrumentId, instrumentId),
      ),
    )
    .orderBy(asc(schema.pmsLot.openedAt), asc(schema.pmsLot.id));
}

export async function listAllLots(
  db: Db,
  accountId: string,
): Promise<schema.PmsLot[]> {
  return db
    .select()
    .from(schema.pmsLot)
    .where(eq(schema.pmsLot.accountId, accountId))
    .orderBy(asc(schema.pmsLot.openedAt), asc(schema.pmsLot.id));
}

export async function updateLotRemaining(
  db: Db,
  lotId: number,
  remainingQty: number,
): Promise<void> {
  await db
    .update(schema.pmsLot)
    .set({ remainingQty })
    .where(eq(schema.pmsLot.id, lotId));
}

export async function insertClosures(
  db: Db,
  closures: (typeof schema.pmsLotClosure.$inferInsert)[],
): Promise<void> {
  if (closures.length === 0) return;
  await db.insert(schema.pmsLotClosure).values(closures);
}

export async function listClosures(
  db: Db,
  accountId: string,
): Promise<schema.PmsLotClosure[]> {
  const lots = await listAllLots(db, accountId);
  const ids = lots.map((l) => l.id);
  if (ids.length === 0) return [];
  return db
    .select()
    .from(schema.pmsLotClosure)
    .where(inArray(schema.pmsLotClosure.lotId, ids))
    .orderBy(asc(schema.pmsLotClosure.closedAt));
}

export async function listInstruments(
  db: Db,
): Promise<schema.PmsInstrument[]> {
  return db.select().from(schema.pmsInstrument);
}

export async function deleteTradeCascade(
  db: Db,
  accountId: string,
  tradeId: number,
): Promise<void> {
  // Lots and closures cascade from the trade FK, so removing the trade is
  // enough. Callers must re-run the matcher afterwards: deleting a BUY can
  // orphan closures that were matched against its lot.
  await db
    .delete(schema.pmsTrade)
    .where(
      and(eq(schema.pmsTrade.id, tradeId), eq(schema.pmsTrade.accountId, accountId)),
    );
}

/**
 * Reset derived state so the book can be replayed from its trades.
 *
 * Closures are deleted; lots are NOT. Lots are kept and rewound to fully open,
 * because a lot's identity must survive a replay: specific-lot selling stores
 * lot ids, and deleting-then-reinserting hands out fresh serials every time,
 * silently invalidating those references. Lots whose trade was deleted have
 * already cascaded away via the foreign key.
 */
export async function resetDerived(db: Db, accountId: string): Promise<void> {
  const lots = await listAllLots(db, accountId);
  const ids = lots.map((l) => l.id);
  if (ids.length > 0) {
    await db
      .delete(schema.pmsLotClosure)
      .where(inArray(schema.pmsLotClosure.lotId, ids));
  }
  await db
    .update(schema.pmsLot)
    .set({ remainingQty: sql`${schema.pmsLot.originalQty}` })
    .where(eq(schema.pmsLot.accountId, accountId));
}

/** Create the lot for a buy, or refresh it if the replay has seen it before. */
export async function upsertLot(
  db: Db,
  lot: typeof schema.pmsLot.$inferInsert,
): Promise<schema.PmsLot> {
  const rows = await db
    .insert(schema.pmsLot)
    .values(lot)
    .onConflictDoUpdate({
      target: schema.pmsLot.tradeId,
      set: {
        openedAt: lot.openedAt,
        originalQty: lot.originalQty,
        remainingQty: lot.remainingQty,
        costPrice: lot.costPrice,
        feesTotal: lot.feesTotal,
        currency: lot.currency,
        fxRate: lot.fxRate,
      },
    })
    .returning();
  return rows[0]!;
}
