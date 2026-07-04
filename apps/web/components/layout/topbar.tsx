import { Badge } from "@/components/ui/badge";

/**
 * Workspace top bar: page title on the left, a mock command hint and
 * environment/market status on the right. Purely presentational in Sprint 000.
 */
export function Topbar({ title }: { title: string }) {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate font-sans text-sm font-semibold text-fg">
          {title}
        </h1>
        <span className="hidden font-mono text-2xs text-faint sm:inline">
          / atlas / invest
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded border border-border bg-surface px-2.5 py-1.5 font-mono text-2xs text-faint md:flex">
          <span>Search</span>
          <kbd className="rounded border border-border px-1 text-faint">
            &#8984;K
          </kbd>
        </div>
        <Badge tone="positive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Live
        </Badge>
        <Badge tone="neutral">{env}</Badge>
      </div>
    </header>
  );
}
