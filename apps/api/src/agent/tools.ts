/**
 * Agent tools (P020) — the typed surface Claude uses to read Atlas data.
 *
 * Each tool wraps existing repo/domain functions and returns compact JSON
 * (trimmed for token efficiency). The agent answers from these exact numbers,
 * not from embeddings — for financial data, tool-calling over the real facts
 * is more accurate than RAG. Tools are READ-ONLY; the agent cannot mutate.
 */
import type { Db } from "../db/repo";
import {
  getCompany,
  getIndustry,
  getPeriodsWithFacts,
  listCompanies,
  listIndustryMetrics,
  listRelationshipsFor,
} from "../db/repo";
import { presentMetrics, presentRatioGroups } from "../domain/presenters";
import { renderStatement } from "../domain/statements";
import { computeScore } from "../domain/scoring";
import { buildEgoGraph } from "../domain/graph";
import { buildCycleSignal, buildMetricSeries } from "../domain/industry";

export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (db: Db, input: Record<string, unknown>) => Promise<unknown>;
}

const ANNUAL = 4;

export const TOOLS: ToolDef[] = [
  {
    name: "list_companies",
    description:
      "List the coverage universe (all companies Atlas tracks) with id, name, ticker, segment and country. Use this to find a company's id before calling other tools.",
    input_schema: { type: "object", properties: {} },
    execute: async (db) => {
      const rows = await listCompanies(db);
      return rows.map((c) => ({
        id: c.id,
        name: c.name,
        ticker: c.ticker,
        segment: c.segment,
        country: c.country,
      }));
    },
  },
  {
    name: "get_company_financials",
    description:
      "Get a company's annual income statement, key metrics and ratio groups (computed server-side). Input: { companyId }.",
    input_schema: {
      type: "object",
      properties: { companyId: { type: "string", description: "Company id, e.g. 'nvidia'." } },
      required: ["companyId"],
    },
    execute: async (db, input) => {
      const id = String(input.companyId);
      const co = await getCompany(db, id);
      if (!co) return { error: `Unknown company '${id}'. Call list_companies first.` };
      const annual = await getPeriodsWithFacts(db, id, "annual", ANNUAL);
      if (annual.length === 0) return { company: co.name, note: "No financial coverage." };
      const facts = annual.map((p) => p.facts);
      return {
        company: co.name,
        currency: annual[annual.length - 1]!.period.currency,
        unit: annual[annual.length - 1]!.period.unit,
        periods: annual.map((p) => p.period.periodLabel),
        incomeStatement: renderStatement("income-statement", facts),
        metrics: presentMetrics(facts),
        ratioGroups: presentRatioGroups(facts),
      };
    },
  },
  {
    name: "get_atlas_score",
    description:
      "Get a company's Atlas Score (0-100), grade and the four factor scores with their metric evidence. Systematic factor score, not advice. Input: { companyId }.",
    input_schema: {
      type: "object",
      properties: { companyId: { type: "string" } },
      required: ["companyId"],
    },
    execute: async (db, input) => {
      const id = String(input.companyId);
      const annual = await getPeriodsWithFacts(db, id, "annual", ANNUAL);
      if (annual.length === 0) return { error: "No data to score." };
      const latest = annual[annual.length - 1]!.period.periodLabel;
      return computeScore(annual.map((p) => p.facts), latest);
    },
  },
  {
    name: "get_rankings",
    description:
      "Rank the whole coverage universe by Atlas Score (highest first). Returns company, ticker, score, grade. Use for 'best/worst' or comparison questions.",
    input_schema: { type: "object", properties: {} },
    execute: async (db) => {
      const companies = await listCompanies(db);
      const rows = await Promise.all(
        companies.map(async (co) => {
          const annual = await getPeriodsWithFacts(db, co.id, "annual", ANNUAL);
          const latest = annual[annual.length - 1]?.period.periodLabel ?? null;
          const s = computeScore(annual.map((p) => p.facts), latest);
          return { name: co.name, ticker: co.ticker, atlasScore: s.atlasScore, grade: s.grade };
        }),
      );
      return rows.sort((a, b) => (b.atlasScore ?? -1) - (a.atlasScore ?? -1));
    },
  },
  {
    name: "get_relationships",
    description:
      "Get a company's supply-chain and competitive relationships (suppliers, customers, competitors). Use for exposure / transmission questions. Input: { companyId }.",
    input_schema: {
      type: "object",
      properties: { companyId: { type: "string" } },
      required: ["companyId"],
    },
    execute: async (db, input) => {
      const id = String(input.companyId);
      const [subject, companies, rels] = await Promise.all([
        getCompany(db, id),
        listCompanies(db),
        listRelationshipsFor(db, id),
      ]);
      if (!subject) return { error: `Unknown company '${id}'.` };
      const nameOf = (cid: string) => companies.find((c) => c.id === cid)?.name ?? cid;
      const g = buildEgoGraph(subject, rels, nameOf);
      return { company: subject.name, relations: g.relations };
    },
  },
  {
    name: "get_industry",
    description:
      "Get an industry's cost/price series and margin cycle signal, plus its member companies. Industry ids: 'rubber-gloves', 'semis-accelerators', 'semis-foundry', 'semis-memory', 'semis-equipment', 'networking', 'dc-power-cooling'. Input: { industryId }.",
    input_schema: {
      type: "object",
      properties: { industryId: { type: "string" } },
      required: ["industryId"],
    },
    execute: async (db, input) => {
      const id = String(input.industryId);
      const ind = await getIndustry(db, id);
      if (!ind) return { error: `Unknown industry '${id}'.` };
      const metricRows = await listIndustryMetrics(db, id);
      const series = buildMetricSeries(metricRows);
      return {
        industry: ind.name,
        sector: ind.sector,
        series: series.map((s) => ({
          key: s.key,
          label: s.label,
          unit: s.unit,
          latest: s.latest,
          latestDate: s.latestDate,
          changeYoYPct: s.changeYoYPct,
        })),
        cycleSignal: buildCycleSignal(series),
      };
    },
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));
