"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { NavTree } from "@/components/layout/nav-tree";
import { useT } from "@/lib/i18n/use-locale";
import type { Dict } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

/**
 * Phone primary navigation: a fixed bottom tab bar (hidden from `lg` up, where
 * the sidebar rail takes over). Four destinations plus "More", which opens the
 * full nav in the shared Drawer — so every route stays one tap away without
 * crowding the bar. Targets are 44px+ and the bar clears the home indicator via
 * `env(safe-area-inset-bottom)`.
 */

interface Tab {
  key: keyof Dict;
  href: string;
  glyph: string;
}

// Mirrors the sidebar's "Daily" group so the two navigations agree about what
// matters. Companies and Markets moved to More: on a phone the owner is far
// more often checking a position than browsing coverage.
const TABS: Tab[] = [
  { key: "nav.home", href: "/", glyph: "HM" },
  { key: "nav.ledger", href: "/ledger", glyph: "LG" },
  { key: "nav.portfolio", href: "/portfolio", glyph: "PF" },
  { key: "nav.watchlist", href: "/watchlist", glyph: "WL" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const t = useT();
  const moreActive = !TABS.some((tab) => isActive(pathname, tab.href));

  return (
    <>
      <nav
        aria-label={t("nav.primaryMobile")}
        className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] transition-colors",
                active
                  ? "text-accent"
                  : "text-fg-muted hover:text-fg focus-visible:text-fg",
              )}
            >
              <span aria-hidden className="font-mono text-xs font-semibold">
                {tab.glyph}
              </span>
              <span className="leading-none">{t(tab.key)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("nav.more")}
          aria-expanded={open}
          className={cn(
            "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] transition-colors",
            moreActive
              ? "text-accent"
              : "text-fg-muted hover:text-fg focus-visible:text-fg",
          )}
        >
          <span aria-hidden className="font-mono text-xs font-semibold">
            &#8943;
          </span>
          <span className="leading-none">{t("nav.more")}</span>
        </button>
      </nav>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        header={
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded bg-accent font-mono text-sm font-bold text-black">
              A
            </span>
            <span className="font-serif text-sm font-semibold text-fg">
              Atlas
            </span>
          </div>
        }
      >
        <nav aria-label={t("nav.allSections")} className="px-3 py-4">
          <NavTree pathname={pathname} />
        </nav>
      </Drawer>
    </>
  );
}
