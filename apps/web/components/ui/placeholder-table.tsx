interface PlaceholderTableProps {
  columns: string[];
  /** Empty-state message shown in place of rows. */
  note?: string;
}

/**
 * Table shell with headers but no rows — makes "no data yet" an explicit,
 * consistent state for the many list-style sections in Milestone 1.
 */
export function PlaceholderTable({
  columns,
  note = "No data in Milestone 1",
}: PlaceholderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-3 py-2 font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
              className="px-3 py-10 text-center text-sm text-muted"
            >
              {note}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
