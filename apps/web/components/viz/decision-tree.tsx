import type { DecisionTreeNode } from "@/lib/mock/knowledge";

interface Placed {
  node: DecisionTreeNode;
  depth: number;
  xIndex: number;
}

const KIND_FILL: Record<DecisionTreeNode["kind"], string> = {
  decision: "var(--accent)",
  option: "var(--info)",
  outcome: "var(--surface-2)",
};
const KIND_TEXT: Record<DecisionTreeNode["kind"], string> = {
  decision: "var(--bg)",
  option: "var(--bg)",
  outcome: "var(--fg)",
};

/** Assign leaf columns left-to-right; internal nodes centre over their children. */
function layout(
  node: DecisionTreeNode,
  depth: number,
  placed: Placed[],
  counter: { leaves: number },
): number {
  const children = node.children ?? [];
  if (children.length === 0) {
    const xi = counter.leaves++;
    placed.push({ node, depth, xIndex: xi });
    return xi;
  }
  const childXs = children.map((c) => layout(c, depth + 1, placed, counter));
  const xi = (childXs[0]! + childXs[childXs.length - 1]!) / 2;
  placed.push({ node, depth, xIndex: xi });
  return xi;
}

/**
 * Decision tree — a deterministic top-down hierarchical layout (no libraries).
 * Nodes coloured by role: decision → option → outcome. Pure SVG.
 */
export function DecisionTree({
  root,
  ariaLabel,
}: {
  root: DecisionTreeNode;
  ariaLabel: string;
}) {
  const placed: Placed[] = [];
  const counter = { leaves: 0 };
  layout(root, 0, placed, counter);

  const xGap = 150;
  const yGap = 92;
  const boxW = 118;
  const boxH = 34;
  const margin = 16;
  const maxDepth = placed.reduce((m, p) => Math.max(m, p.depth), 0);
  const W = counter.leaves * xGap + margin * 2;
  const H = (maxDepth + 1) * yGap + margin;

  const posById = new Map<string, { x: number; y: number }>();
  placed.forEach((p) => {
    posById.set(p.node.id, {
      x: margin + p.xIndex * xGap + xGap / 2,
      y: margin + p.depth * yGap + boxH / 2,
    });
  });

  const edges: { from: string; to: string }[] = [];
  const walk = (n: DecisionTreeNode) => {
    (n.children ?? []).forEach((c) => {
      edges.push({ from: n.id, to: c.id });
      walk(c);
    });
  };
  walk(root);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        role="img"
        aria-label={ariaLabel}
        className="max-w-none"
      >
        {edges.map((e, i) => {
          const a = posById.get(e.from)!;
          const b = posById.get(e.to)!;
          const midY = (a.y + b.y) / 2;
          return (
            <path
              key={i}
              d={`M${a.x} ${a.y + boxH / 2} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - boxH / 2}`}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          );
        })}
        {placed.map((p) => {
          const pos = posById.get(p.node.id)!;
          return (
            <g key={p.node.id}>
              <rect
                x={pos.x - boxW / 2}
                y={pos.y - boxH / 2}
                width={boxW}
                height={boxH}
                rx={6}
                fill={KIND_FILL[p.node.kind]}
                stroke="var(--border)"
              />
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={12}
                fontFamily="var(--font-sans)"
                fill={KIND_TEXT[p.node.kind]}
              >
                {p.node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
