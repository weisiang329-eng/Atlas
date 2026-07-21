import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export type StatementRowKind = "section" | "line" | "total";

export interface StatementRow {
  label: string;
  /** One value per period column; null renders as an em dash. */
  values: (number | null)[];
  kind?: StatementRowKind;
  indent?: boolean;
}

interface StatementTableProps {
  periods: string[];
  rows: StatementRow[];
  /** Unit label shown under the first column header, e.g. "USD millions". */
  unit?: string;
  caption?: string;
}

function formatValue(v: number | null): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  const formatted = fmtNumber(abs);
  return v < 0 ? `(${formatted})` : formatted;
}

/**
 * Financial-statement table: a label column plus one column per period, with
 * section headers, indented lines and emphasized totals. Presentation only —
 * values are passed in pre-computed (no ratios or math here). Reused across
 * income statement, balance sheet and cash flow.
 */
export function StatementTable({
  periods,
  rows,
  unit,
  caption,
}: StatementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-[1] bg-surface px-3 py-[var(--cell-py)] text-left align-bottom"
            >
              <span className="font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint">
                Line item
              </span>
              {unit ? (
                <span className="mt-0.5 block text-2xs normal-case text-faint">
                  {unit}
                </span>
              ) : null}
            </th>
            {periods.map((p) => (
              <th
                key={p}
                scope="col"
                className="whitespace-nowrap px-3 py-[var(--cell-py)] text-right font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint"
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const kind = row.kind ?? "line";
            if (kind === "section") {
              return (
                <tr key={`${row.label}-${i}`}>
                  <th
                    scope="colgroup"
                    colSpan={periods.length + 1}
                    className="sticky left-0 bg-surface px-3 pb-1.5 pt-4 text-left font-mono text-2xs font-semibold uppercase tracking-[0.1em] text-muted"
                  >
                    {row.label}
                  </th>
                </tr>
              );
            }
            const isTotal = kind === "total";
            return (
              <tr
                key={`${row.label}-${i}`}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  isTotal && "border-t border-border bg-surface-2/40",
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 bg-surface px-3 py-[var(--cell-py)] text-left font-sans font-normal",
                    row.indent && "pl-6",
                    isTotal ? "font-semibold text-fg" : "text-muted",
                  )}
                >
                  {row.label}
                </th>
                {row.values.map((v, vi) => (
                  <td
                    key={vi}
                    className={cn(
                      "whitespace-nowrap px-3 py-[var(--cell-py)] text-right num tabular-nums",
                      isTotal ? "font-semibold text-fg" : "text-fg",
                      v !== null && v < 0 && "text-negative",
                    )}
                  >
                    {formatValue(v)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
