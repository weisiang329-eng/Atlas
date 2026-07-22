import type { ValueChainNode } from "@/lib/mock/industries";

/**
 * Value-chain map — v1 renders as an ordered stage strip (not the full graph
 * viz yet: components/viz/relationship-graph.tsx should be reused for the
 * node-and-edge version in v2 per docs/design/P006). This gets the "who
 * supplies whom, in order" read immediately with no new heavy component.
 */
export function ValueChainStrip({ nodes }: { nodes: ValueChainNode[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {nodes.map((n, i) => (
        <div key={n.stage} className="flex items-stretch gap-2">
          <div className="flex min-w-[160px] flex-col gap-2 rounded-panel border border-border bg-surface p-3 shadow-panel">
            <span className="text-2xs uppercase tracking-wide text-faint">{n.stage}</span>
            <div className="flex flex-wrap gap-1.5">
              {n.companies.length === 0 ? (
                <span className="text-2xs text-faint">—</span>
              ) : (
                n.companies.map((c) => (
                  <span key={c} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-2xs text-fg">
                    {c}
                  </span>
                ))
              )}
            </div>
          </div>
          {i < nodes.length - 1 ? (
            <span aria-hidden className="flex items-center text-faint">→</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
