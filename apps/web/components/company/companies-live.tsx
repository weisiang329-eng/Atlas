"use client";

/**
 * Live coverage universe — fetches /v1/companies with the static universe as
 * instant fallback, then hands rows to the existing browser UI.
 */
import { Badge } from "@/components/ui/badge";
import { DataState } from "@/components/ui/data-state";
import { CompaniesBrowser } from "@/components/company/companies-browser";
import { useApiResource } from "@/lib/loaders/use-api";
import { isApiConfigured } from "@/lib/api/client";
import { ready } from "@/lib/resource";
import { STATIC_UNIVERSE } from "@/lib/universe";
import type { CompanySummary } from "@/lib/types";

export function CompaniesLive() {
  const live = isApiConfigured();
  const r = useApiResource<CompanySummary[]>(
    "/v1/companies",
    ready(STATIC_UNIVERSE),
  );
  const companies = r.data ?? [];

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Badge tone="accent">{live ? "Live universe" : "Sample universe"}</Badge>
        <span className="text-xs text-muted">
          {companies.length} companies
          {live ? " · Atlas API" : " · static snapshot"}
        </span>
      </div>
      <DataState status={r.status}>
        <CompaniesBrowser companies={companies} />
      </DataState>
    </>
  );
}
