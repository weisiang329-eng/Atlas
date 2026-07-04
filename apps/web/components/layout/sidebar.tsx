"use client";

import { usePathname } from "next/navigation";
import { NavGroups } from "@/components/layout/nav-groups";

/**
 * Left navigation rail. Client component so it can highlight the active route.
 * Hidden below `lg`; every item is a real link (placeholder modules are tagged
 * "soon" but remain navigable).
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <span className="grid h-7 w-7 place-items-center rounded bg-accent font-mono text-sm font-bold text-black">
          A
        </span>
        <div className="leading-tight">
          <p className="font-serif text-sm font-semibold text-fg">Atlas</p>
          <p className="text-2xs uppercase tracking-[0.14em] text-faint">
            Intelligence
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <NavGroups pathname={pathname} />
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-2xs text-faint">Milestone 1 · Company Intelligence</p>
        <p className="font-mono text-2xs text-faint">v0.1.0</p>
      </div>
    </aside>
  );
}
