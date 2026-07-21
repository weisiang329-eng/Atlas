# Web Live Wiring Plan — mock → live data (P004 frontend scope)

**Status:** in progress · **Branch:** `feat/web-live-wiring` (stacks on `feat/backend-foundation`) · **Date:** 2026-07-21

Executes the migration recipe in `docs/00-foundation/integration-points.md`
under the static-export constraint (Cloudflare Pages, no SSR): live data
arrives by **client-side fetch** against the Worker API.

## Design

- **`lib/types.ts`** ✅ — frontend copies of the API wire contracts
  (`CompanySummary`, `CompanyFinancials`, `StatementPayload`, `MetricRow`,
  `RatioGroup`, `ResultRow` (nullable), `TrendsPayload`). Kept in lock-step
  with `apps/api/src/domain/presenters.ts`.
- **`lib/universe.ts`** ✅ — static snapshot of the 10 seeded companies. Jobs:
  `generateStaticParams` for `/companies/[companyId]/*`, instant first paint,
  full fallback when no API is configured. Sync with `apps/api/seed/data.mjs`.
- **`lib/loaders/use-api.ts`** ✅ — `useApiResource<T>(path, fallback?)`:
  API configured → loading → ready | empty (404/[]) | error; not configured →
  fallback resource (the labelled sample data). `path:null` → stays loading.
- **`components/financial/subject-context.tsx`** ✅ — which company the
  `/financials` workspace analyses. Live: universe list from API, default
  first company, persisted in localStorage (`atlas.financials.subject`).
  No API: single fictional sample subject (Helios), badged Mock.
- **`components/financial/subject-selector.tsx`** ✅ — header control
  (native select over universe · Live badge).

## Remaining steps (exact)

1. **`components/financial/live-sections.tsx`** (client): sections used by the
   9 financials pages — `OverviewSection` (StatGrid from latest trends +
   revenue/net-income charts), `StatementSection(type)` (StatementTable via
   `/statements/:type`, mock fallback = existing `lib/mock/financials` rows),
   `MetricsSection` (DataTable + Sparkline), `RatiosSection` (KpiCard grid per
   group, mock fallback = `lib/mock/ratios`), `TrendsSection` (3 TrendCharts),
   `ResultsSection(periodType)` (ResultsTable + BarSeries; quarterly returns
   real empty state until quarterly facts are seeded). All render inside
   `<DataState status={resource.status}>`.
2. Rewire pages to thin server shells (metadata + section): `financials/page`,
   `income-statement`, `balance-sheet`, `cash-flow`, `metrics`, `ratios`,
   `historical-trends`, `annual`, `quarterly`; wrap `financials/layout.tsx`
   children in `FinancialSubjectProvider`, replace static subject box with
   `<SubjectSelector/>`.
3. `app/companies/page.tsx` → client fetch `/v1/companies` (fallback
   `STATIC_UNIVERSE`); `CompaniesBrowser` takes `CompanySummary` from
   `lib/types` (drop `MockCompany` import).
4. `app/companies/[companyId]/layout.tsx` → `generateStaticParams` from
   `STATIC_UNIVERSE`; header renders universe identity (same fields).
   `app/companies/[companyId]/financials/page.tsx` → live statements by param.
5. `components/data/results-table.tsx` → null-tolerant (`—` for null cells),
   type from `lib/types`.
6. `apps/web/.env.example` — `NEXT_PUBLIC_API_BASE_URL=`; note in README.
7. Green: `npm run typecheck && npm run lint && npm run build -w @atlas/web`.
8. Verify in browser against `wrangler dev` API (subject switch, statements,
   ratios, empty quarterly, error state with API stopped).

## Rules

- No component fetches directly — only via `useApiResource`.
- Mock modules stay until every consumer of each is wired; delete per-file then.
- Errors surface as plain language through `<DataState>`, never status codes.
