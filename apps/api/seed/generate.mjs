/**
 * Generates seed.sql (Postgres) from data.mjs.
 *
 * Idempotent upserts keyed on natural keys; facts resolve their period id by
 * (company_id, period_label). Run:
 *
 *   node seed/generate.mjs
 *   # then run seed/seed.sql in the Supabase SQL editor (or via psql)
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMPANIES, INDUSTRIES } from "./data.mjs";
import { HEADER, n, q, upsert, upsertFacts, upsertPeriod } from "./pg.mjs";

const lines = [HEADER("seed/generate.mjs")];

const SEED_NOTE =
  "Approximate annual figures compiled manually from public filings (10-K/20-F/annual reports). Not audited copies; some concepts omitted. Superseded by automated ingestion (P022).";

for (const c of COMPANIES) {
  lines.push(
    upsert(
      "source",
      {
        id: q(`seed-${c.id}`),
        kind: q("seed"),
        name: q(`Manual seed — ${c.name} public filings`),
        url: q(c.website),
        retrieved_at: q("2026-07-21"),
        note: q(SEED_NOTE),
      },
      ["id"],
      ["kind", "name", "url", "retrieved_at", "note"],
    ),
  );
}

for (const i of INDUSTRIES) {
  lines.push(
    upsert(
      "industry",
      {
        id: q(i.id),
        name: q(i.name),
        sector: q(i.sector),
        description: q(i.description),
        chain_order: n(i.chainOrder),
      },
      ["id"],
      ["name", "sector", "description", "chain_order"],
    ),
  );
}

for (const c of COMPANIES) {
  lines.push(
    upsert(
      "company",
      {
        id: q(c.id),
        name: q(c.name),
        ticker: q(c.ticker),
        exchange: q(c.exchange),
        segment: q(c.segment),
        country: q(c.country),
        industry_id: q(c.industryId),
        description: q(c.description),
        headquarters: q(c.headquarters),
        founded_year: n(c.foundedYear),
        website: q(c.website),
        reporting_currency: q(c.currency),
      },
      ["id"],
      ["name", "ticker", "exchange", "segment", "country", "industry_id", "description", "headquarters", "founded_year", "website", "reporting_currency"],
    ),
  );

  for (const p of c.periods) {
    lines.push(
      upsertPeriod({
        companyId: c.id,
        periodLabel: p.label,
        periodType: "annual",
        fiscalYear: p.fiscalYear,
        fiscalQuarter: null,
        currency: c.currency,
        unit: c.unit,
        reportDate: null,
        sourceId: `seed-${c.id}`,
      }),
    );
    const facts = upsertFacts(c.id, p.label, p.facts, `seed-${c.id}`);
    if (facts) lines.push(facts);
  }
}

const out = join(dirname(fileURLToPath(import.meta.url)), "seed.sql");
writeFileSync(out, lines.join("\n") + "\n");
console.log(
  `Wrote ${out}: ${COMPANIES.length} companies, ` +
    `${COMPANIES.reduce((a, c) => a + c.periods.length, 0)} periods, ` +
    `${COMPANIES.reduce((a, c) => a + c.periods.reduce((b, p) => b + Object.keys(p.facts).length, 0), 0)} facts.`,
);
