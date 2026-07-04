import type { VersionEntry } from "@/lib/mock/reports";

/** Version history — reports are versioned and reproducible; history is kept. */
export function VersionHistoryPanel({ entries }: { entries: VersionEntry[] }) {
  return (
    <ol className="overflow-hidden rounded-panel border border-border">
      {entries.map((v) => (
        <li
          key={v.version}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border px-4 py-3 last:border-0"
        >
          <span className="font-mono text-sm font-semibold text-fg">
            {v.version}
          </span>
          <span className="font-mono text-2xs text-faint">{v.date}</span>
          <span className="text-2xs text-faint">{v.author}</span>
          <span className="w-full text-sm text-muted sm:w-auto sm:flex-1">
            {v.change}
          </span>
        </li>
      ))}
    </ol>
  );
}
