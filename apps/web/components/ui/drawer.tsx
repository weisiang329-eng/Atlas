"use client";

import { useRef, type ReactNode } from "react";
import { useOverlay } from "@/lib/use-overlay";
import { cn } from "@/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: string;
  /** Custom header content, replacing the default title (close button is kept). */
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible side sheet. Shares the overlay a11y (focus trap, Escape, scroll
 * lock, focus restore) with Dialog. For filters, detail panels and contextual
 * navigation. Full-height panel sliding from either edge.
 */
export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  header,
  children,
  className,
}: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute top-0 flex h-full w-80 max-w-[85%] flex-col bg-surface shadow-panel outline-none",
          side === "right" ? "right-0 border-l border-border" : "left-0 border-r border-border",
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          {header ?? <h2 className="font-serif text-base text-fg">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            &times;
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
