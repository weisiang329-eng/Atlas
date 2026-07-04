import { RelationshipGraph } from "@/components/viz/relationship-graph";
import type { EntityKind, GraphEdge, GraphNode } from "@/lib/mock/knowledge";

const LEGEND: { kind: EntityKind; label: string; color: string }[] = [
  { kind: "company", label: "Company", color: "var(--accent)" },
  { kind: "supplier", label: "Supplier", color: "var(--info)" },
  { kind: "customer", label: "Customer", color: "var(--positive)" },
  { kind: "competitor", label: "Competitor", color: "var(--negative)" },
  { kind: "sector", label: "Sector", color: "var(--warning)" },
];

/**
 * Knowledge graph = the relationship graph plus an entity-kind legend. Same
 * primitive, framed as the typed-entity view for the knowledge workspace.
 */
export function KnowledgeGraph({
  nodes,
  edges,
  ariaLabel,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  ariaLabel: string;
}) {
  return (
    <div>
      <RelationshipGraph nodes={nodes} edges={edges} ariaLabel={ariaLabel} />
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map((l) => (
          <li key={l.kind} className="flex items-center gap-1.5 text-2xs text-muted">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
