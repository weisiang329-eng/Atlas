import { Badge } from "@/components/ui/badge";

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category?: string;
  description?: string;
}

/**
 * Vertical event timeline. Reused for company history, research versions and
 * decision logs. Presentation only — events are passed in, never fetched.
 */
export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative flex flex-col">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* connector */}
          {i < events.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[7px] top-4 h-full w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden
            className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-accent bg-bg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <time className="font-mono text-2xs text-faint">{e.date}</time>
              {e.category ? <Badge tone="neutral">{e.category}</Badge> : null}
            </div>
            <p className="mt-1 text-sm font-medium text-fg">{e.title}</p>
            {e.description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {e.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
