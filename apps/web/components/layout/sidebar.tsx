"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/cn";

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

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="eyebrow px-2 pb-2">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={item.description}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-surface-2 font-medium text-fg"
                          : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-2xs font-semibold",
                          active ? "bg-accent text-black" : "bg-surface-2 text-faint",
                        )}
                      >
                        {item.glyph}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.soon ? (
                        <span className="text-2xs uppercase tracking-wide text-faint">
                          soon
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-2xs text-faint">Milestone 1 · Company Intelligence</p>
        <p className="font-mono text-2xs text-faint">v0.1.0</p>
      </div>
    </aside>
  );
}
