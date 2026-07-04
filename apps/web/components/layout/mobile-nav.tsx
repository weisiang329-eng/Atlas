"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { NavGroups } from "@/components/layout/nav-groups";

/**
 * Mobile navigation: a hamburger (shown below `lg`) opening the shared `Drawer`
 * with the full nav. Built on Drawer/useOverlay, so focus trap, Escape, scroll
 * lock and focus restore come for free. Closes on route change.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        <nav aria-label="Main navigation" className="px-3 py-4">
          <NavGroups pathname={pathname} />
        </nav>
      </Drawer>
    </div>
  );
}
