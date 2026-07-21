"use client";

/**
 * Column visibility control (docs/DESIGN-SYSTEM.md §4).
 *
 * Sits in the panel header, persists per table in localStorage, and refuses to
 * hide the first column — a row must always be identifiable. Hidden columns
 * still participate in search, so a user looking for a value they cannot see
 * still finds the row.
 */
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/cn";

export interface ColumnOption {
  key: string;
  header: string;
  /** The identity column — always visible, never offered as a toggle. */
  locked?: boolean;
}

export function useColumnVisibility(tableId: string, columns: ColumnOption[]) {
  const storageKey = `atlas.columns.${tableId}`;
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHidden(JSON.parse(raw) as string[]);
    } catch {
      /* storage unavailable — every column simply stays visible */
    }
  }, [storageKey]);

  const toggle = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (col?.locked) return;
    const next = hidden.includes(key)
      ? hidden.filter((k) => k !== key)
      : [...hidden, key];
    setHidden(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* not persisted — the session still works */
    }
  };

  const reset = () => {
    setHidden([]);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* nothing to clear */
    }
  };

  return { hidden, toggle, reset, isHidden: (k: string) => hidden.includes(k) };
}

export function ColumnPicker({
  columns,
  hidden,
  onToggle,
  onReset,
}: {
  columns: ColumnOption[];
  hidden: string[];
  onToggle: (key: string) => void;
  onReset: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = columns.length - hidden.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 font-mono text-2xs uppercase tracking-[0.08em] transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
          hidden.length > 0 ? "text-accent" : "text-faint",
        )}
      >
        {t("table.columns")}
        <span className="num">
          {shown}/{columns.length}
        </span>
      </button>

      {open ? (
        <div className="glass absolute right-0 z-30 mt-1 w-52 rounded-panel border border-border p-1.5 shadow-pop">
          <ul className="flex flex-col">
            {columns.map((c) => {
              const isHidden = hidden.includes(c.key);
              return (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => onToggle(c.key)}
                    disabled={c.locked}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
                      c.locked
                        ? "cursor-default text-faint"
                        : "text-fg hover:bg-surface-2",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px]",
                        isHidden
                          ? "border-border-strong text-transparent"
                          : "border-accent bg-accent text-black",
                      )}
                    >
                      ✓
                    </span>
                    <span className="flex-1 truncate">{c.header}</span>
                    {c.locked ? (
                      <span className="font-mono text-2xs text-faint">
                        {t("table.locked")}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {hidden.length > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="mt-1 w-full rounded border-t border-border px-2 py-1.5 font-mono text-2xs uppercase tracking-[0.08em] text-faint transition-colors hover:text-fg"
            >
              {t("table.showAll")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
