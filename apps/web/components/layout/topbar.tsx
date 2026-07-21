"use client";

import { Badge } from "@/components/ui/badge";
import { CommandSearch } from "@/components/layout/command-search";
import { LocaleSwitch } from "@/components/layout/locale-switch";
import { useT } from "@/lib/i18n/use-locale";
import { NAV_ITEM_KEYS } from "@/lib/nav";
import { usePathname } from "next/navigation";

/**
 * Workspace top bar: page title on the left, a mock command hint and
 * environment status on the right. Navigation below `lg` lives in the bottom
 * tab bar (`BottomTabBar`), so no hamburger is duplicated here; the status
 * badges collapse away on phones to leave the title room to breathe.
 */
export function Topbar({ title }: { title: string }) {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";
  const t = useT();
  const pathname = usePathname();
  // Prefer the localised nav label for this route; fall back to the literal
  // title the page passed (sub-routes and dynamic pages have no nav entry).
  const key = NAV_ITEM_KEYS[pathname];
  const heading = key ? t(key) : title;

  return (
    <header className="glass sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border px-4 sm:px-6 print:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden font-mono text-2xs text-faint sm:inline">
          atlas /
        </span>
        <h1 className="truncate font-sans text-sm font-semibold text-fg">
          {heading}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <CommandSearch />
        <LocaleSwitch />
        <Badge tone="positive">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          {t("common.live")}
        </Badge>
        <span className="hidden sm:inline">
          <Badge tone="neutral">{env}</Badge>
        </span>
      </div>
    </header>
  );
}
