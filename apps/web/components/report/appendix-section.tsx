import type { AppendixItem } from "@/lib/mock/reports";

/** Appendix — supporting notes, collapsed by default to keep the document lean. */
export function AppendixSection({ items }: { items: AppendixItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((a, i) => (
        <details
          key={i}
          className="group rounded-panel border border-border bg-surface"
        >
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-fg marker:content-none focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent">
            {a.title}
            <span
              aria-hidden
              className="font-mono text-faint transition-transform group-open:rotate-90"
            >
              &rsaquo;
            </span>
          </summary>
          <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted">
            {a.note}
          </p>
        </details>
      ))}
    </div>
  );
}
