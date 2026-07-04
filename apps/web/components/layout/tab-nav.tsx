"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SubTab } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * Reusable horizontal sub-navigation (company detail, research workspace).
 * Client component: highlights the active tab by exact path match.
 */
export function TabNav({ items }: { items: SubTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
