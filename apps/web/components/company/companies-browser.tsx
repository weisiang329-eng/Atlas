"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FilterBar } from "@/components/ui/filter-bar";
import { DetailPanelLayout } from "@/components/layout/detail-panel-layout";
import { Badge } from "@/components/ui/badge";
import { StatGrid } from "@/components/ui/stat-grid";
import { cn } from "@/lib/cn";
import type { MockCompany } from "@/lib/mock/companies";

/**
 * Master–detail company browser: FilterBar + DetailPanelLayout. The list filters
 * live; selecting a company shows an instant preview with a link to the full
 * profile. Composes the layout and interaction frameworks — the pattern future
 * entity workspaces (suppliers, targets, holdings) reuse.
 */
export function CompaniesBrowser({ companies }: { companies: MockCompany[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(companies[0]?.id ?? "");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      `${c.name} ${c.ticker} ${c.segment} ${c.country}`
        .toLowerCase()
        .includes(q),
    );
  }, [companies, query]);

  const selected = companies.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <FilterBar
        search={query}
        onSearch={setQuery}
        placeholder="Search companies"
        right={`${visible.length} / ${companies.length}`}
      />

      <DetailPanelLayout
        leftWidth="md"
        list={
          <ul
            className="flex max-h-[32rem] flex-col overflow-y-auto rounded-panel border border-border bg-surface"
            aria-label="Companies"
          >
            {visible.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted">
                No companies match “{query}”.
              </li>
            ) : (
              visible.map((c) => {
                const active = c.id === selectedId;
                return (
                  <li key={c.id} className="border-b border-border last:border-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 -outline-offset-2 focus-visible:outline-accent",
                        active ? "bg-surface-2" : "hover:bg-surface-2/60",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {c.name}
                        </span>
                        <span className="font-mono text-2xs text-faint">
                          {c.segment}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-2xs text-muted">
                        {c.ticker}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        }
        detail={selected ? <CompanyPreview company={selected} /> : null}
      />
    </>
  );
}

function CompanyPreview({ company }: { company: MockCompany }) {
  const monogram = company.ticker.slice(0, 2).toUpperCase();
  const facts: { label: string; value: string }[] = [
    { label: "Ticker", value: company.ticker },
    { label: "Exchange", value: company.exchange },
    { label: "Segment", value: company.segment },
    { label: "Country", value: company.country },
  ];

  return (
    <div className="rounded-panel border border-border bg-surface shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-panel border border-border bg-surface-2 font-mono text-base font-semibold text-faint">
            {monogram}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg text-fg">{company.name}</h2>
              <Badge tone="accent">Sample</Badge>
            </div>
            <p className="mt-0.5 font-mono text-2xs text-muted">
              {company.exchange}: {company.ticker}
            </p>
          </div>
        </div>
        <Link
          href={`/companies/${company.id}/overview`}
          className="rounded border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:bg-surface-2"
        >
          Open full profile →
        </Link>
      </div>

      <div className="p-4">
        <StatGrid
          items={[
            { label: "Atlas Score", value: "—" },
            { label: "Market Cap", value: "—" },
            { label: "Conviction", value: "—" },
            { label: "Upside", value: "—" },
          ]}
        />
        <dl className="mt-4 divide-y divide-border rounded-panel border border-border">
          {facts.map((f) => (
            <div
              key={f.label}
              className="flex items-center justify-between gap-4 px-4 py-2.5"
            >
              <dt className="text-sm text-muted">{f.label}</dt>
              <dd className="font-mono text-sm text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
