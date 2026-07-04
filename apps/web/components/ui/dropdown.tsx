"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Menu dropdown. Click or keyboard to open; Escape and outside-click to close;
 * ArrowUp/Down move focus between items. ARIA menu semantics.
 */
export function Dropdown({
  label,
  items,
  align = "left",
}: {
  label: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function move(from: number, dir: 1 | -1) {
    const n = items.length;
    let i = from;
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if (!items[i]?.disabled) break;
    }
    itemRefs.current[i]?.focus();
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {label}
        <span aria-hidden className="text-faint">
          &#9662;
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-20 mt-1 min-w-[10rem] overflow-hidden rounded-panel border border-border bg-surface py-1 shadow-panel",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((it, i) => (
            <button
              key={it.label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="menuitem"
              type="button"
              disabled={it.disabled}
              onClick={() => {
                it.onSelect();
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  move(i, 1);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  move(i, -1);
                }
              }}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:bg-surface-2 focus-visible:text-fg focus-visible:outline-none"
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
