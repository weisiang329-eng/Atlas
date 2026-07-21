"use client";

import { usePathname } from "next/navigation";
import { NavTree } from "@/components/layout/nav-tree";

/**
 * Left navigation rail. Client component so it can highlight the active route.
 * Hidden below `lg`; every item is a real link (placeholder modules are tagged
 * "soon" but remain navigable).
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[15rem] shrink-0 flex-col border-r border-border bg-surface lg:flex print:hidden">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="grid h-7 w-7 place-items-center rounded bg-accent font-serif text-sm font-bold text-black">
          A
        </span>
        <div className="leading-tight">
          <p className="font-serif text-sm font-semibold text-fg">Atlas</p>
          <p className="text-[0.625rem] uppercase tracking-[0.14em] text-faint">
            Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 pr-3" aria-label="Primary">
        <NavTree pathname={pathname} />
      </nav>

      {/* The footer used to advertise "Milestone 1", which stopped being true
          a long time ago. A stale label in permanent view is worse than none —
          it teaches the reader to distrust the chrome. */}
      <div className="border-t border-border px-4 py-2.5">
        <p className="font-mono text-2xs text-faint">v0.1.0</p>
      </div>
    </aside>
  );
}
