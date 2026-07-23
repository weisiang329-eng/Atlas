"use client";

import { useMemo, useState } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import {
  ColumnPicker,
  useColumnVisibility,
} from "@/components/data/column-picker";
import { useLocale } from "@/lib/i18n/use-locale";
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
  /**
   * Below `sm`, render rows as stacked cards instead of a horizontally
   * scrolling table. Use on primary lists (holdings, watchlist, orders);
   * leave off for dense reference tables (financial statements) where
   * side-by-side period comparison is the point.
   */
  mobileCards?: boolean;
  /**
   * Enable the column picker. The value is the persistence key, so a user's
   * choice sticks per table rather than per session (DESIGN-SYSTEM §4).
   */
  columnPickerId?: string;
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
  searchPlaceholder,
  mobileCards = false,
  columnPickerId,
}: DataTableProps<T>) {
  const { t, locale } = useLocale();
  const zh = locale === "zh";
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    null,
  );

  // Column visibility. The first column is the row's identity and is locked.
  // Search still runs over ALL columns, hidden ones included, so a user can
  // find a row by a value the table is not currently showing.
  const columnOptions = useMemo(
    () =>
      columns.map((c, i) => ({ key: c.key, header: c.header, locked: i === 0 })),
    [columns],
  );
  const { hidden, toggle, reset } = useColumnVisibility(
    columnPickerId ?? "default",
    columnOptions,
  );
  const visibleColumns = useMemo(
    () =>
      columnPickerId ? columns.filter((c) => !hidden.includes(c.key)) : columns,
    [columns, hidden, columnPickerId],
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

      // Missing values always sort LAST, in both directions
      // (DESIGN-SYSTEM §4). A blank climbing to the top of a descending sort
      // is the classic table bug: it reads as "the highest value".
      const aMissing = av === null || av === undefined || av === "";
      const bMissing = bv === null || bv === undefined || bv === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;

      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
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
      {searchable || columnPickerId ? (
        <div className="flex items-center gap-2 px-3 pt-3">
          {searchable ? (
            <div className="min-w-0 flex-1">
              <FilterBar
                search={query}
                onSearch={(v) => {
                  setQuery(v);
                  setPage(0);
                }}
                placeholder={searchPlaceholder ?? (zh ? "搜索" : "Search")}
                right={`${sortedRows.length} / ${rows.length}`}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {columnPickerId ? (
            <ColumnPicker
              columns={columnOptions}
              hidden={hidden}
              onToggle={toggle}
              onReset={reset}
            />
          ) : null}
        </div>
      ) : null}
      {mobileCards ? (
        <ul className="flex flex-col gap-2 p-3 sm:hidden">
          {visible.map((row) => {
            const [primary, ...rest] = visibleColumns;
            const cell = (c: Column<T>) =>
              c.render
                ? c.render(row)
                : String((row as Record<string, unknown>)[c.key] ?? "");
            return (
              <li key={getRowId(row)}>
                <div
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "rounded-panel border border-border bg-surface p-3 shadow-panel transition-colors",
                    onRowClick &&
                      "cursor-pointer hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  )}
                >
                  {primary ? (
                    <div className="mb-2 text-sm font-semibold text-fg">
                      {cell(primary)}
                    </div>
                  ) : null}
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {rest.map((c) => (
                      <div key={c.key} className="flex flex-col gap-0.5">
                        <dt className="font-mono text-2xs uppercase tracking-[0.08em] text-faint">
                          {c.header}
                        </dt>
                        <dd
                          className={cn(
                            "text-fg",
                            c.numeric && "num tabular-nums",
                          )}
                        >
                          {cell(c)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className={cn("overflow-x-auto", mobileCards && "hidden sm:block")}>
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
              {visibleColumns.map((c) => {
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
                        // Announce what the NEXT click does, following the
                        // asc -> desc -> unsorted cycle (DESIGN-SYSTEM §4).
                        title={
                          !isSorted
                            ? t("table.sortAsc")
                            : sort!.dir === "asc"
                              ? t("table.sortDesc")
                              : t("table.sortClear")
                        }
                        aria-label={`${c.header} — ${
                          !isSorted
                            ? t("table.sortAsc")
                            : sort!.dir === "asc"
                              ? t("table.sortDesc")
                              : t("table.sortClear")
                        }`}
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
                {visibleColumns.map((c) => (
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
            {Math.min((current + 1) * pageSize!, sortedRows.length)}
            {zh ? "，共 " : " of "}
            {sortedRows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="rounded border border-border px-2 py-1 transition-colors enabled:hover:bg-surface-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={zh ? "上一页" : "Previous page"}
            >
              {zh ? "上一页" : "Prev"}
            </button>
            <span className="num px-1 tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={current >= pageCount - 1}
              className="rounded border border-border px-2 py-1 transition-colors enabled:hover:bg-surface-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              aria-label={zh ? "下一页" : "Next page"}
            >
              {zh ? "下一页" : "Next"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
