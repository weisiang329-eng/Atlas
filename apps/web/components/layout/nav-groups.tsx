"use client";

import Link from "next/link";
import { NAV_GROUPS, NAV_GROUP_KEYS, NAV_ITEM_KEYS } from "@/lib/nav";
import { useT } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Shared navigation list rendered by both the desktop sidebar and the mobile
 * drawer, so nav stays defined once (`NAV_GROUPS`) and looks identical in both.
 * New modules appear everywhere by editing the model alone.
 */
export function NavGroups({ pathname }: { pathname: string }) {
  const t = useT();
  // Localised label, falling back to the English literal in the model so the
  // nav still renders if a key is missing.
  const groupLabel = (title: string) =>
    NAV_GROUP_KEYS[title] ? t(NAV_GROUP_KEYS[title]!) : title;
  const itemLabel = (href: string, label: string) =>
    NAV_ITEM_KEYS[href] ? t(NAV_ITEM_KEYS[href]!) : label;

  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-5">
          <p className="eyebrow px-3 pb-1.5">{groupLabel(group.title)}</p>
          <ul>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.description}
                    className={cn(
                      // A 2px accent rail marks the active row instead of a
                      // filled chip. The eye finds one bright edge faster than
                      // it finds one filled badge among twenty grey ones — and
                      // colour stays reserved for meaning (DESIGN-SYSTEM §2).
                      "relative flex items-center gap-2.5 rounded-r py-1.5 pl-3 pr-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                      "before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:transition-colors",
                      active
                        ? "bg-surface-2 font-medium text-fg before:bg-accent"
                        : "text-muted before:bg-transparent hover:bg-surface-2/60 hover:text-fg",
                    )}
                  >
                    {/* The glyph is a quiet mono monogram, not a filled chip:
                        it survives the collapsed rail and reads as texture
                        rather than as twenty competing buttons. */}
                    <span
                      aria-hidden
                      className={cn(
                        "w-5 shrink-0 font-mono text-2xs font-medium tabular-nums transition-colors",
                        active ? "text-accent" : "text-faint",
                      )}
                    >
                      {item.glyph}
                    </span>
                    <span className="flex-1 truncate">
                      {itemLabel(item.href, item.label)}
                    </span>
                    {item.soon ? (
                      <span className="rounded-pill bg-surface-3 px-1.5 py-px font-mono text-[9px] uppercase tracking-wide text-faint">
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
    </>
  );
}
