interface HeatmapProps {
  rows: string[];
  cols: string[];
  /** values[rowIndex][colIndex], 0–100. */
  values: number[][];
  ariaLabel: string;
}

function tone(v: number): string {
  if (v >= 80) return "bg-negative/70 text-fg";
  if (v >= 60) return "bg-negative/35 text-fg";
  if (v >= 40) return "bg-warning/35 text-fg";
  if (v >= 20) return "bg-positive/30 text-fg";
  return "bg-positive/15 text-muted";
}

/**
 * Intensity heatmap (rows × columns). Cell tint runs green → amber → red so the
 * pattern reads at a glance; the value stays visible for precision. Pure CSS,
 * server-rendered, accessible as a table.
 */
export function Heatmap({ rows, cols, values, ariaLabel }: HeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-separate border-spacing-1 text-sm"
        aria-label={ariaLabel}
      >
        <thead>
          <tr>
            <th className="w-28" />
            {cols.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-2 pb-1 text-center font-mono text-2xs font-medium uppercase tracking-wide text-faint"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={row}>
              <th
                scope="row"
                className="whitespace-nowrap pr-2 text-right text-xs text-muted"
              >
                {row}
              </th>
              {cols.map((_, c) => {
                const v = values[r]?.[c] ?? 0;
                return (
                  <td
                    key={c}
                    className={`rounded text-center font-mono text-2xs tabular-nums ${tone(v)}`}
                    style={{ height: "2.25rem" }}
                    title={`${row} · ${cols[c]}: ${v}`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
