"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * Mobile navigation: a hamburger (shown below `lg`) opening a slide-over drawer
 * with the full nav. Closes on route change, overlay click and Escape.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape to close; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded border border-border bg-surface text-fg transition-colors hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span aria-hidden className="text-base leading-none">
          &#9776;
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <nav
            aria-label="Main navigation"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-r border-border bg-surface"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded bg-accent font-mono text-sm font-bold text-black">
                  A
                </span>
                <span className="font-serif text-sm font-semibold text-fg">
                  Atlas
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
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
                            className={cn(
                              "flex items-center gap-2.5 rounded px-2 py-2 text-sm transition-colors",
                              active
                                ? "bg-surface-2 font-medium text-fg"
                                : "text-muted hover:bg-surface-2 hover:text-fg",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-2xs font-semibold",
                                active
                                  ? "bg-accent text-black"
                                  : "bg-surface-2 text-faint",
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
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
