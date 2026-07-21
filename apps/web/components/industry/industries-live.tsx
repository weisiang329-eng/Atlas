"use client";

/**
 * Live industry taxonomy — groups the coverage industries by sector and links
 * to each workspace. Static snapshot is the instant paint + API-less fallback.
 */
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { ready } from "@/lib/resource";
import { STATIC_INDUSTRIES } from "@/lib/universe";

interface IndustryRow {
  id: string;
  name: string;
  sector: string;
}

export function IndustriesLive() {
  const live = isApiConfigured();
  const r = useApiResource<IndustryRow[]>("/v1/industries", ready(STATIC_INDUSTRIES));
  const rows = r.data ?? [];

  const bySector = new Map<string, IndustryRow[]>();
  for (const row of rows) {
    const g = bySector.get(row.sector) ?? [];
    g.push(row);
    bySector.set(row.sector, g);
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">{live ? "Live taxonomy" : "Sample taxonomy"}</Badge>
        <span className="text-xs text-muted">{rows.length} industries</span>
      </div>
      <DataState status={r.status}>
        <div className="flex flex-col gap-6">
          {[...bySector.entries()].map(([sector, industries]) => (
            <div key={sector}>
              <p className="eyebrow mb-2">{sector}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {industries.map((ind) => (
                  <Link
                    key={ind.id}
                    href={`/industries/${ind.id}`}
                    className="rounded-panel border border-border bg-surface p-4 shadow-panel transition-colors hover:border-accent-dim"
                  >
                    <p className="font-serif text-base font-semibold text-fg">
                      {ind.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">{sector}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DataState>
    </>
  );
}
