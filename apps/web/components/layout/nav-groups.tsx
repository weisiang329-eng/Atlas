import Link from "next/link";
import { NAV_GROUPS } from "@/lib/nav";
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
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-6">
          <p className="eyebrow px-2 pb-2">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.description}
                    className={cn(
                      "flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
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
    </>
  );
}
