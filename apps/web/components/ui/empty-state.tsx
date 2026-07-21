import { Badge } from "@/components/ui/badge";

interface EmptyStateProps {
  title: string;
  body: string;
  /** Optional status chip, e.g. "P008" or "Awaiting auth". Omit for a plain state. */
  tag?: string;
}

/**
 * Makes "nothing here yet" an explicit, designed state rather than blank space.
 *
 * For a module that is blocked on data that does not exist yet, prefer
 * `PlannedModule` — it states the shape and the blocker.
 */
export function EmptyState({ title, body, tag }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-border bg-surface-3 px-6 py-14 text-center">
      {tag ? <Badge tone="neutral">{tag}</Badge> : null}
      <h3 className="font-serif text-lg text-fg">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
