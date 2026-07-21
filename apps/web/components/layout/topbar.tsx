import { Badge } from "@/components/ui/badge";
import { CommandSearch } from "@/components/layout/command-search";

/**
 * Workspace top bar: page title on the left, a mock command hint and
 * environment status on the right. Navigation below `lg` lives in the bottom
 * tab bar (`BottomTabBar`), so no hamburger is duplicated here; the status
 * badges collapse away on phones to leave the title room to breathe.
 */
export function Topbar({ title }: { title: string }) {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

  return (
    <header className="glass sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border px-4 sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden font-mono text-2xs text-faint sm:inline">
          atlas /
        </span>
        <h1 className="truncate font-sans text-sm font-semibold text-fg">
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <CommandSearch />
        <Badge tone="positive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Live
        </Badge>
        <span className="hidden sm:inline">
          <Badge tone="neutral">{env}</Badge>
        </span>
      </div>
    </header>
  );
}
