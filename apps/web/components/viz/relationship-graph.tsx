import type { EntityKind, GraphEdge, GraphNode } from "@/lib/mock/knowledge";

const KIND_COLOR: Record<EntityKind, string> = {
  company: "var(--accent)",
  supplier: "var(--info)",
  customer: "var(--positive)",
  competitor: "var(--negative)",
  sector: "var(--warning)",
};

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  ariaLabel: string;
  height?: number;
}

/**
 * Entity relationship graph. Deterministic radial layout (first node at the
 * centre, the rest on a ring) — no physics, so it renders identically on the
 * server every time. Pure SVG. Node colour encodes entity kind.
 */
export function RelationshipGraph({
  nodes,
  edges,
  ariaLabel,
  height = 360,
}: RelationshipGraphProps) {
  if (nodes.length === 0) return null;

  const W = 640;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 74;

  const center = nodes[0]!;
  const ring = nodes.slice(1);
  const pos = new Map<string, { x: number; y: number }>();
  pos.set(center.id, { x: cx, y: cy });
  ring.forEach((n, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, ring.length);
    pos.set(n.id, {
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    });
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={ariaLabel}
    >
      {edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return null;
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="var(--border)"
            strokeWidth={1.5}
          />
        );
      })}
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const isCenter = n.id === center.id;
        const r = isCenter ? 10 : 7;
        return (
          <g key={n.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={KIND_COLOR[n.kind]}
              stroke="var(--bg)"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y + (isCenter ? 26 : 20)}
              textAnchor="middle"
              fill="var(--fg)"
              fontSize={isCenter ? 13 : 11}
              fontFamily="var(--font-sans)"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
