/**
 * Value-chain builder (P006). Orders an industry set into chain stages
 * (industries with a chainOrder) and threads the cross-stage supply edges
 * from the relationship graph, so the frontend can render "who feeds whom"
 * along the AI-hardware stack: equipment → foundry → memory → accelerators →
 * networking → power.
 */
import type { Company, Industry, Relationship } from "../db/schema.ts";

export interface ChainCompanyDto {
  id: string;
  name: string;
  ticker: string;
}

export interface ChainStageDto {
  industryId: string;
  name: string;
  sector: string;
  order: number;
  companies: ChainCompanyDto[];
}

export interface ChainEdgeDto {
  fromStage: string;
  toStage: string;
  fromCompany: string;
  toCompany: string;
  label: string | null;
}

export interface ValueChainDto {
  stages: ChainStageDto[];
  edges: ChainEdgeDto[];
}

/**
 * Build the value chain from all industries (those with chainOrder), the
 * companies, and the 'supplies' relationships. Only supply edges that cross
 * from an upstream stage to a downstream one are included (the chain flow).
 */
export function buildValueChain(
  industries: Industry[],
  companies: Company[],
  rels: Relationship[],
): ValueChainDto {
  const staged = industries
    .filter((i) => i.chainOrder !== null && i.chainOrder !== undefined)
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));

  const stageOf = new Map<string, Industry>(); // companyId -> its industry
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const industryById = new Map(staged.map((i) => [i.id, i]));

  for (const c of companies) {
    if (c.industryId && industryById.has(c.industryId)) {
      stageOf.set(c.id, industryById.get(c.industryId)!);
    }
  }

  const stages: ChainStageDto[] = staged.map((i) => ({
    industryId: i.id,
    name: i.name,
    sector: i.sector,
    order: i.chainOrder ?? 0,
    companies: companies
      .filter((c) => c.industryId === i.id)
      .map((c) => ({ id: c.id, name: c.name, ticker: c.ticker })),
  }));

  const edges: ChainEdgeDto[] = [];
  for (const r of rels) {
    if (r.relationType !== "supplies") continue;
    const from = stageOf.get(r.fromId);
    const to = stageOf.get(r.toId);
    if (!from || !to) continue;
    if ((from.chainOrder ?? 0) >= (to.chainOrder ?? 0)) continue; // upstream → downstream only
    edges.push({
      fromStage: from.id,
      toStage: to.id,
      fromCompany: companyById.get(r.fromId)?.ticker ?? r.fromId,
      toCompany: companyById.get(r.toId)?.ticker ?? r.toId,
      label: r.label,
    });
  }

  return { stages, edges };
}
