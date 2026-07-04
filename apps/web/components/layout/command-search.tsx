"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { NAV_GROUPS, FINANCIAL_TABS, RESEARCH_TABS } from "@/lib/nav";
import { REPORT_INDEX } from "@/lib/mock/reports";
import { MOCK_COMPANIES } from "@/lib/mock/companies";
import { cn } from "@/lib/cn";

interface Command {
  label: string;
  sub?: string;
  href: string;
  group: string;
}

function buildIndex(): Command[] {
  const nav: Command[] = NAV_GROUPS.flatMap((g) =>
    g.items.map((it) => ({ label: it.label, href: it.href, group: g.title })),
  );
  const companies: Command[] = MOCK_COMPANIES.map((c) => ({
    label: c.name,
    sub: c.ticker,
    href: `/companies/${c.id}/overview`,
    group: "Companies",
  }));
  const reports: Command[] = REPORT_INDEX.map((r) => ({
    label: r.type,
    sub: r.subject,
    href: `/reports/${r.id}`,
    group: "Reports",
  }));
  const financial: Command[] = FINANCIAL_TABS.map((t) => ({
    label: `Financials · ${t.label}`,
    href: t.href,
    group: "Financials",
  }));
  const research: Command[] = RESEARCH_TABS.map((t) => ({
    label: `Research · ${t.label}`,
    href: t.href,
    group: "Research",
  }));
  return [...nav, ...companies, ...reports, ...financial, ...research];
}

/**
 * Command palette (⌘K / Ctrl+K). Fuzzy-free substring search across navigation,
 * companies, reports and workspace tabs, with arrow-key selection and Enter to
 * navigate. Replaces the placeholder search box; keyboard-first, accessible via
 * the Dialog primitive.
 */
export function CommandSearch() {
  const router = useRouter();
  const index = useMemo(buildIndex, []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? index.filter((c) =>
          `${c.label} ${c.sub ?? ""} ${c.group}`.toLowerCase().includes(q),
        )
      : index;
    return list.slice(0, 24);
  }, [query, index]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function go(cmd: Command | undefined) {
    if (!cmd) return;
    close();
    router.push(cmd.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded border border-border bg-surface px-2.5 py-1.5 font-mono text-2xs text-faint transition-colors hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        aria-label="Open command search"
      >
        <span aria-hidden>&#9906;</span>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border px-1 text-faint sm:inline">
          &#8984;K
        </kbd>
      </button>

      <Dialog open={open} onClose={close} className="max-w-xl p-0">
        <div onKeyDown={onInputKey}>
        <div className="border-b border-border p-3">
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setActive(0);
            }}
            placeholder="Search companies, reports, workspaces…"
            aria-label="Command search"
          />
        </div>
        <div
          className="max-h-80 overflow-y-auto p-2"
          role="listbox"
          aria-label="Results"
        >
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              No matches for “{query}”.
            </p>
          ) : (
            results.map((cmd, i) => (
              <button
                key={`${cmd.href}-${i}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(cmd)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-surface-2 text-fg" : "text-muted",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{cmd.label}</span>
                  {cmd.sub ? (
                    <span className="truncate font-mono text-2xs text-faint">
                      {cmd.sub}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-mono text-2xs uppercase tracking-wide text-faint">
                  {cmd.group}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 font-mono text-2xs text-faint">
          <span>↑↓ to move · ↵ to open</span>
          <span>esc to close</span>
        </div>
        </div>
      </Dialog>
    </>
  );
}
