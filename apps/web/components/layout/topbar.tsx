import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandSearch } from "@/components/layout/command-search";

/**
 * Workspace top bar: page title on the left, a mock command hint and
 * environment status on the right. Includes the mobile nav trigger below `lg`.
 */
export function Topbar({ title }: { title: string }) {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <span className="font-mono text-2xs text-faint">atlas /</span>
        <h1 className="truncate font-sans text-sm font-semibold text-fg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <CommandSearch />
        <Badge tone="positive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Live
        </Badge>
        <Badge tone="neutral">{env}</Badge>
      </div>
    </header>
  );
}
