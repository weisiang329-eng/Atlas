import { Badge } from "@/components/ui/badge";

interface EmptyStateProps {
  title: string;
  body: string;
}

/** Placeholder block that makes "no feature yet" an explicit, designed state. */
export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-border px-6 py-14 text-center">
      <Badge tone="accent">Sprint 000</Badge>
      <h3 className="font-serif text-lg text-fg">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
