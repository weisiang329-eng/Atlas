"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { NavGroups } from "@/components/layout/nav-groups";
import { cn } from "@/lib/cn";

/**
 * Phone primary navigation: a fixed bottom tab bar (hidden from `lg` up, where
 * the sidebar rail takes over). Four destinations plus "More", which opens the
 * full nav in the shared Drawer — so every route stays one tap away without
 * crowding the bar. Targets are 44px+ and the bar clears the home indicator via
 * `env(safe-area-inset-bottom)`.
 */

interface Tab {
  label: string;
  href: string;
  glyph: string;
}

const TABS: Tab[] = [
  { label: "Home", href: "/", glyph: "HM" },
  { label: "Companies", href: "/companies", glyph: "CO" },
  { label: "Markets", href: "/markets", glyph: "MK" },
  { label: "Watchlist", href: "/watchlist", glyph: "WL" },
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

  const moreActive = !TABS.some((t) => isActive(pathname, t.href));

  return (
    <>
      <nav
        aria-label="Primary mobile"
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
              <span className="leading-none">{tab.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="More navigation"
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
          <span className="leading-none">More</span>
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
        <nav aria-label="All sections" className="px-3 py-4">
          <NavGroups pathname={pathname} />
        </nav>
      </Drawer>
    </>
  );
}
