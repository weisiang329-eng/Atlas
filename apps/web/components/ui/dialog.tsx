"use client";

import { useRef, type ReactNode } from "react";
import { useOverlay } from "@/lib/use-overlay";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Accessible modal dialog. Overlay + centered panel, focus-trapped, Escape and
 * overlay-click to close, body scroll locked, focus restored on close. The base
 * for confirmations, detail views and the command palette.
 */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
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
          "relative z-10 w-full max-w-lg rounded-panel border border-border bg-surface shadow-panel outline-none",
          className,
        )}
      >
        {title ? (
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-serif text-base text-fg">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              &times;
            </button>
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}
