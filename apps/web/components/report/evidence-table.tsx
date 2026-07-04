import { Badge } from "@/components/ui/badge";
import type { EvidenceItem, Level } from "@/lib/mock/reports";

const CONF: Record<Level, "positive" | "warning" | "neutral"> = {
  High: "positive",
  Medium: "warning",
  Low: "neutral",
};

/** Evidence log — every claim linked to a source, type, confidence and date. */
export function EvidenceTable({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Claim", "Source", "Type", "Confidence", "Date"].map((h) => (
              <th
                key={h}
                scope="col"
                className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((e, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5 text-fg">{e.claim}</td>
              <td className="px-3 py-2.5 text-muted">{e.source}</td>
              <td className="px-3 py-2.5 text-muted">{e.type}</td>
              <td className="px-3 py-2.5">
                <Badge tone={CONF[e.confidence]}>{e.confidence}</Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs text-faint">
                {e.date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
