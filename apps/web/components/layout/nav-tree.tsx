"use client";

/**
 * Three-layer sidebar navigation.
 *
 * Layer 1 is a section heading, layer 2 a module, layer 3 a sub-page. Modules
 * with children carry a disclosure chevron and expand in place, so the whole
 * product is reachable without first navigating into it.
 *
 * Two behaviours worth stating:
 * - A module with children is BOTH a link and a toggle. Clicking the row
 *   navigates; clicking the chevron only expands. Making the row a pure toggle
 *   would strand the module's own overview page.
 * - Expansion state persists per module, but the branch containing the current
 *   route is always open — returning to a page should never hide where you are.
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  NAV_TREE,
  hasActiveChild,
  isRouteActive,
  type NavLeaf,
} from "@/lib/nav-tree";
import { useT } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "atlas.nav.expanded";

function useExpanded(pathname: string) {
  const [open, setOpen] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setOpen(JSON.parse(raw) as string[]);
    } catch {
      /* storage unavailable — sections just start collapsed */
    }
  }, []);

  const toggle = useCallback((href: string) => {
    setOpen((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* not persisted — the session still works */
      }
      return next;
    });
  }, []);

  // The branch you are standing in is always open, whatever the stored state.
  const isOpen = useCallback(
    (item: NavLeaf) =>
      open.includes(item.href) ||
      isRouteActive(pathname, item.href) ||
      hasActiveChild(pathname, item),
    [open, pathname],
  );

  return { isOpen, toggle };
}

function ModuleRow({
  item,
  pathname,
  expanded,
  onToggle,
}: {
  item: NavLeaf;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const active = isRouteActive(pathname, item.href);
  const childActive = hasActiveChild(pathname, item);
  const hasChildren = Boolean(item.children?.length);

  return (
    <li>
      <div
        className={cn(
          "group relative flex items-center rounded-r transition-colors",
          // A 2px rail marks the active branch. One bright edge is easier to
          // find than one filled badge among twenty grey ones, and it keeps
          // colour reserved for meaning (DESIGN-SYSTEM §2).
          "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:transition-colors",
          active || childActive
            ? "bg-surface-2 before:bg-accent"
            : "before:bg-transparent hover:bg-surface-2/60",
        )}
      >
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-3 pr-1 text-sm transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
            active ? "font-medium text-fg" : "text-muted group-hover:text-fg",
          )}
        >
          {item.glyph ? (
            <span
              aria-hidden
              className={cn(
                "w-5 shrink-0 font-mono text-2xs font-medium transition-colors",
                active || childActive ? "text-accent" : "text-faint",
              )}
            >
              {item.glyph}
            </span>
          ) : null}
          <span className="truncate">{t(item.labelKey)}</span>
        </Link>

        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={`${t(item.labelKey)} — ${expanded ? "collapse" : "expand"}`}
            className="grid h-7 w-7 shrink-0 place-items-center rounded text-faint transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent"
          >
            <span
              aria-hidden
              className={cn(
                "text-[9px] leading-none transition-transform duration-150",
                expanded ? "rotate-90" : "rotate-0",
              )}
            >
              ▶
            </span>
          </button>
        ) : null}
      </div>

      {hasChildren && expanded ? (
        // The connector line makes the parent-child relationship visible
        // without indentation alone having to carry it.
        <ul className="ml-[1.4rem] mt-0.5 flex flex-col border-l border-border-soft pl-2">
          {item.children!.map((child) => {
            const childOn = isRouteActive(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={childOn ? "page" : undefined}
                  className={cn(
                    "block truncate rounded py-1 pl-2 pr-2 text-2xs transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                    childOn
                      ? "bg-surface-2 font-medium text-fg"
                      : "text-faint hover:bg-surface-2/60 hover:text-muted",
                  )}
                >
                  {t(child.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function NavTree({ pathname }: { pathname: string }) {
  const t = useT();
  const { isOpen, toggle } = useExpanded(pathname);

  return (
    <>
      {NAV_TREE.map((section) => (
        <div key={section.title} className="mb-5">
          <p className="eyebrow px-3 pb-1.5">{t(section.titleKey)}</p>
          <ul className="flex flex-col gap-px">
            {section.items.map((item) => (
              <ModuleRow
                key={item.href}
                item={item}
                pathname={pathname}
                expanded={isOpen(item)}
                onToggle={() => toggle(item.href)}
              />
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
