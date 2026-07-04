import { Badge } from "@/components/ui/badge";
import type { Source } from "@/lib/mock/reports";

/** Source register. Links are intentionally inert until a document backend exists. */
export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-panel border border-border">
      {sources.map((s, i) => (
        <li
          key={i}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{s.title}</p>
            <p className="text-2xs text-faint">{s.publisher}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="neutral">{s.type}</Badge>
            <span className="font-mono text-2xs text-faint">{s.date}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
