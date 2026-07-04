export type ActivityKind =
  | "filing"
  | "research"
  | "alert"
  | "decision"
  | "system";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  meta?: string;
  time: string;
}

const KIND_COLOR: Record<ActivityKind, string> = {
  filing: "var(--info)",
  research: "var(--accent)",
  alert: "var(--negative)",
  decision: "var(--positive)",
  system: "var(--faint)",
};

/**
 * Chronological activity feed — filings, research, alerts and decisions in one
 * stream. Colour-coded by kind. Presentation only; events are passed in.
 */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < items.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[5px] top-3.5 h-full w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden
            className="relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-surface"
            style={{ backgroundColor: KIND_COLOR[e.kind] }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-medium text-fg">{e.title}</span>
              <time className="font-mono text-2xs text-faint">{e.time}</time>
            </div>
            {e.meta ? (
              <p className="mt-0.5 text-xs text-muted">{e.meta}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
