"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  /** Cell renderer; defaults to String(row[key]). */
  render?: (row: T) => React.ReactNode;
  /** Right-align and use tabular figures (for numbers). */
  numeric?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** When set and rows exceed it, the table paginates client-side. */
  pageSize?: number;
  stickyHeader?: boolean;
  caption?: string;
  onRowClick?: (row: T) => void;
}

/**
 * Generic, reusable data table. Performance-first: paginates large datasets
 * client-side so only a page of rows is ever in the DOM. No data fetching — it
 * renders whatever rows it is handed. Accessible: real table semantics, a
 * caption, and scoped headers.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  pageSize,
  stickyHeader = true,
  caption,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);

  const paginated = Boolean(pageSize && rows.length > pageSize);
  const pageCount = paginated ? Math.ceil(rows.length / pageSize!) : 1;
  const current = Math.min(page, pageCount - 1);

  const visible = useMemo(() => {
    if (!paginated) return rows;
    const start = current * pageSize!;
    return rows.slice(start, start + pageSize!);
  }, [rows, paginated, current, pageSize]);

  const alignClass = (c: Column<T>) =>
    c.align === "center"
      ? "text-center"
      : c.align === "right" || c.numeric
        ? "text-right"
        : "text-left";

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {caption ? (
            <caption className="sr-only">{caption}</caption>
          ) : null}
          <thead
            className={cn(
              stickyHeader && "sticky top-0 z-[1] bg-surface",
            )}
          >
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-3 py-[var(--cell-py)] font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint",
                    alignClass(c),
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  onRowClick
                    ? "cursor-pointer hover:bg-surface-2"
                    : "hover:bg-surface-2/60",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-[var(--cell-py)] text-fg",
                      c.numeric && "font-mono tabular-nums",
                      alignClass(c),
                      c.className,
                    )}
                  >
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginated ? (
        <div className="flex items-center justify-between gap-4 border-t border-border px-3 py-2 text-xs text-muted">
          <span className="tabular-nums">
            {current * pageSize! + 1}–
            {Math.min((current + 1) * pageSize!, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="rounded border border-border px-2 py-1 transition-colors enabled:hover:bg-surface-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Previous page"
            >
              Prev
            </button>
            <span className="px-1 tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              className="rounded border border-border px-2 py-1 transition-colors enabled:hover:bg-surface-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
