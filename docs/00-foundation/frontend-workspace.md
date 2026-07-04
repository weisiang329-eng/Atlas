# Atlas Frontend Workspace v0.1 (Milestone 1)

Structure of the Atlas web frontend (`apps/web`). Milestone 1 delivers the
Company Intelligence and Research workspaces as **layout and navigation only** —
no business logic, AI, portfolio/trading, auth, OCR, ERP, or payments. Sample
data is labelled and carries no fabricated metrics.

## Navigation

Sidebar, grouped. Every item is a real route; `soon` = navigable placeholder.

| Group     | Items                                                                     |
| --------- | ------------------------------------------------------------------------- |
| Workspace | Home · Companies · Industries* · Research · Financials · Reports · Knowledge |
| Positions | Portfolio* · Watchlist* · Alerts*                                         |
| System    | Admin* · Settings*                                                        |

`*` placeholder module (renders a "planned" page).

## Route map

| Route                         | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `/`                           | Home / overview (dashboard-first)          |
| `/companies`                  | Companies index (sample universe)          |
| `/companies/[companyId]`      | → redirects to `/overview`                 |
| `/companies/[companyId]/overview`   | Snapshot, key facts                  |
| `/companies/[companyId]/profile`    | Identity and reference attributes    |
| `/companies/[companyId]/products`   | Product / segment breakdown          |
| `/companies/[companyId]/management` | Leadership and ownership             |
| `/companies/[companyId]/financials` | Statements and metrics               |
| `/companies/[companyId]/research`   | Company-scoped research              |
| `/companies/[companyId]/valuation`  | Multiples and model output           |
| `/companies/[companyId]/documents`  | Filings, transcripts, sources        |
| `/companies/[companyId]/timeline`   | Chronological event / decision log   |
| `/research`                   | Research overview                          |
| `/research/notes`             | Working notes (`research_note`)            |
| `/research/reports`           | Reports (`research_report`)                |
| `/research/evidence`          | Evidence log (`research_evidence`)         |
| `/research/versions`          | Revision history (`research_version`)      |
| `/research/hypotheses`        | Open theses (`research_hypothesis`)        |
| `/research/decision-journal`  | Decisions (`decision_journal`)             |
| `/financials`                 | Financial overview (KPIs, trend charts, states demo) |
| `/financials/income-statement` `/balance-sheet` `/cash-flow` | Statements (`StatementTable`) |
| `/financials/metrics`         | Metrics with sparklines (`DataTable`)      |
| `/financials/historical-trends` | Trend charts (`TrendChart`)              |
| `/financials/quarterly` `/financials/annual` | Results (`ResultsTable`, paginated) |
| `/reports`                    | Report library (9 report types)            |
| `/reports/[reportId]`         | Intelligence report document (`ReportLayout`) |
| `/knowledge`                  | Knowledge overview (graph + heatmap)       |
| `/knowledge/graph` `/heatmap` `/decision-tree` | Visualization primitives (`components/viz`) |
| `/industries` `/portfolio` `/watchlist` `/alerts` `/admin` `/settings` | Planned modules |

The financial workspace operates on a **fictional sample subject** (Helios
Compute Corp); all figures are illustrative mock data. Component contracts are
documented in [`ui-component-library.md`](./ui-component-library.md).

Company and research sections mirror the `company_*` and `research_*` groups in
[`schemas/database-v0.md`](../../schemas/database-v0.md), so the UI maps 1:1 onto
the data model.

## Conventions

- **Shell**: top-level pages wrap themselves in `AppShell`; company and research
  sub-pages render inside their workspace `layout.tsx` (which owns the shell,
  header and `TabNav`) — no double shell.
- **Reusable primitives** live in `components/ui`; no per-feature one-offs.
- **No business logic in the UI** — scoring and valuation stay server-side.
- **APIs** are reached only through `NEXT_PUBLIC_API_BASE_URL`; nothing is wired
  until a backend contract exists.
- **Theming** is CSS variables in `app/globals.css` (dark default, `.light`
  ready). Dark-mode readiness is preserved.
