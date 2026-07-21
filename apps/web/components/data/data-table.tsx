"use client";

import { useMemo, useState } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
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
  /** Make the column header clickable to sort. */
  sortable?: boolean;
  /** Value used for sorting; defaults to row[key]. */
  sortAccessor?: (row: T) => string | number;
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
  /** Show a built-in search box that filters rows across all column values. */
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search",
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    null,
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return rows;
    return rows.filter((r) =>
      columns.some((c) => {
        const v = c.sortAccessor
          ? c.sortAccessor(r)
          : (r as Record<string, unknown>)[c.key];
        return String(v ?? "").toLowerCase().includes(q);
      }),
    );
  }, [rows, columns, query, searchable]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const col = columns.find((c) => c.key === sort.key);
    const accessor =
      col?.sortAccessor ??
      ((r: T) => (r as Record<string, unknown>)[sort.key] as string | number);
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredRows, sort, columns]);

  const paginated = Boolean(pageSize && sortedRows.length > pageSize);
  const pageCount = paginated ? Math.ceil(sortedRows.length / pageSize!) : 1;
  const current = Math.min(page, pageCount - 1);

  const visible = useMemo(() => {
    if (!paginated) return sortedRows;
    const start = current * pageSize!;
    return sortedRows.slice(start, start + pageSize!);
  }, [sortedRows, paginated, current, pageSize]);

  function toggleSort(key: string) {
    setPage(0);
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  const alignClass = (c: Column<T>) =>
    c.align === "center"
      ? "text-center"
      : c.align === "right" || c.numeric
        ? "text-right"
        : "text-left";

  return (
    <div className="flex flex-col">
      {searchable ? (
        <div className="px-3 pt-3">
          <FilterBar
            search={query}
            onSearch={(v) => {
              setQuery(v);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            right={`${sortedRows.length} / ${rows.length}`}
          />
        </div>
      ) : null}
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
              {columns.map((c) => {
                const isSorted = sort?.key === c.key;
                const ariaSort: "ascending" | "descending" | "none" | undefined =
                  c.sortable
                  ? isSorted
                    ? sort!.dir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "whitespace-nowrap px-3 py-[var(--cell-py)] font-mono text-2xs font-medium uppercase tracking-[0.08em] text-faint",
                      alignClass(c),
                      c.className,
                    )}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 uppercase tracking-[0.08em] transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                          isSorted && "text-fg",
                        )}
                      >
                        {c.header}
                        <span aria-hidden className="text-[9px] leading-none">
                          {isSorted ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
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
                      c.numeric && "num tabular-nums",
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
          <span className="num tabular-nums">
            {current * pageSize! + 1}–
            {Math.min((current + 1) * pageSize!, sortedRows.length)} of{" "}
            {sortedRows.length}
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
            <span className="num px-1 tabular-nums">
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
