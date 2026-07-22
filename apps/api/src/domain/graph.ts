/**
 * Knowledge-graph builders (P007). Turns directed relationship rows into the
 * frontend's ego-graph shape (a subject node at the centre, related companies
 * around it) with the correct node kind and edge label for the viewing side.
 */
import type { Company, Relationship } from "../db/schema.ts";

export type EntityKind =
  | "company"
  | "supplier"
  | "customer"
  | "competitor"
  | "sector";

export interface GraphNodeDto {
  id: string;
  label: string;
  kind: EntityKind;
}

export interface GraphEdgeDto {
  from: string;
  to: string;
  label?: string;
}

export interface EgoGraphDto {
  subject: { id: string; name: string };
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
  /** Flat relation list for a text panel alongside the graph. */
  relations: {
    id: string;
    name: string;
    kind: EntityKind;
    relation: string;
    label: string | null;
    note: string | null;
  }[];
}

/**
 * Build the ego graph for `subject` from all relationships touching it.
 * `nameOf` resolves a company id to a display name.
 */
export function buildEgoGraph(
  subject: Company,
  rels: Relationship[],
  nameOf: (id: string) => string,
): EgoGraphDto {
  const nodes: GraphNodeDto[] = [
    { id: subject.id, label: subject.name, kind: "company" },
  ];
  const edges: GraphEdgeDto[] = [];
  const relations: EgoGraphDto["relations"] = [];
  const seen = new Set<string>();

  for (const r of rels) {
    const outgoing = r.fromId === subject.id;
    const otherId = outgoing ? r.toId : r.fromId;
    if (otherId === subject.id) continue;

    let kind: EntityKind;
    let edgeLabel: string;
    let relation: string;
    if (r.relationType === "competes_with") {
      kind = "competitor";
      edgeLabel = "competes";
      relation = "Competitor";
    } else {
      // "supplies": from → to. If subject is the supplier (from), the other is
      // a customer; if subject is the buyer (to), the other is a supplier.
      kind = outgoing ? "customer" : "supplier";
      edgeLabel = outgoing ? "supplies" : "supplied by";
      relation = outgoing ? "Customer" : "Supplier";
    }

    if (!seen.has(otherId)) {
      nodes.push({ id: otherId, label: nameOf(otherId), kind });
      seen.add(otherId);
    }
    // Draw the edge subject → other so the ego layout fans out from centre.
    edges.push({ from: subject.id, to: otherId, label: edgeLabel });
    relations.push({
      id: otherId,
      name: nameOf(otherId),
      kind,
      relation,
      label: r.label,
      note: r.note,
    });
  }

  // Stable ordering: suppliers, customers, competitors.
  const order: Record<EntityKind, number> = {
    company: 0, supplier: 1, customer: 2, competitor: 3, sector: 4,
  };
  relations.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name));

  return {
    subject: { id: subject.id, name: subject.name },
    nodes,
    edges,
    relations,
  };
}

/**
 * The full universe graph: every company a node, every relationship an edge.
 * Node kind is "company" (roles are relative in a full graph); competitor
 * edges are de-duplicated (stored once, symmetric).
 */
export function buildFullGraph(
  companies: Company[],
  rels: Relationship[],
): { nodes: GraphNodeDto[]; edges: GraphEdgeDto[] } {
  const inGraph = new Set<string>();
  for (const r of rels) {
    inGraph.add(r.fromId);
    inGraph.add(r.toId);
  }
  const nodes = companies
    .filter((c) => inGraph.has(c.id))
    .map((c) => ({ id: c.id, label: c.ticker, kind: "company" as EntityKind }));
  const edges = rels.map((r) => ({
    from: r.fromId,
    to: r.toId,
    label: r.relationType === "competes_with" ? "competes" : "supplies",
  }));
  return { nodes, edges };
}
