import type { DecisionEntry } from "@/lib/mock/reports";

/**
 * Decision log — the audit trail of decisions attached to the report: what was
 * decided, by whom, and the outcome. Decisions are never deleted.
 */
export function DecisionMemoSection({ entries }: { entries: DecisionEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {["Date", "Decision", "Owner", "Outcome"].map((h) => (
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
          {entries.map((d, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-2xs text-muted">
                {d.date}
              </td>
              <td className="px-3 py-2.5 text-fg">{d.decision}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                {d.owner}
              </td>
              <td className="px-3 py-2.5 text-muted">{d.outcome}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
