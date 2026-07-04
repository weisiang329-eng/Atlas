# Atlas Web

Frontend for the Atlas Intelligence Platform — an institutional research
terminal for AI-native decision intelligence.

This package holds the Atlas web frontend. It currently ships the **Milestone 1
Company Intelligence foundation** on top of the Sprint 000 shell: the Company
and Research workspaces, full navigation, and reusable layout primitives —
**structure and layout only**. No product features (scoring, real company data,
AI chat, portfolio/trading, auth, OCR, ERP integration, payments) are built. Any
sample data is clearly labelled and carries no fabricated metrics.

See the route map in [`docs/00-foundation/frontend-workspace.md`](../../docs/00-foundation/frontend-workspace.md).

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v3** with CSS-variable design tokens
- **IBM Plex** Sans / Mono / Serif via `next/font`
- ESLint (`eslint-config-next`)

## Getting started

```bash
cd apps/web
npm install
cp .env.example .env.local   # optional; sane defaults are built in
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | Purpose                            |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the dev server               |
| `npm run build`     | Production build                   |
| `npm run start`     | Serve the production build         |
| `npm run lint`      | ESLint (Next core-web-vitals + TS) |
| `npm run typecheck` | `tsc --noEmit` (strict)            |

## Structure

```text
apps/web/
  app/
    layout.tsx                    Root layout, fonts, metadata
    globals.css                   Tailwind + design tokens (dark default, light ready)
    page.tsx                      Home / overview (dashboard-first)
    companies/
      page.tsx                    Companies index (sample universe)
      [companyId]/
        layout.tsx                Company header + section tabs
        page.tsx                  → redirects to overview
        overview|profile|products|management|financials|
        research|valuation|documents|timeline/page.tsx
    research/
      layout.tsx                  Research header + section tabs
      page.tsx                    Research overview
      notes|reports|evidence|versions|hypotheses|
      decision-journal/page.tsx
    industries|portfolio|watchlist|alerts|admin|settings/page.tsx   Planned modules
  components/
    layout/       App shell: sidebar, topbar, tab-nav, mobile-nav
    data/         data-table (paginated), statement-table, results-table
    chart/        chart-container, trend-chart, bar-series, sparkline (pure SVG)
    ui/           panel, badge, stat, page-header, section-heading, timeline,
                  document-viewer, placeholder-table, coming-soon, and the async
                  state system: data-state, loading-state, error-state, empty-state
  lib/
    nav.ts        Navigation model (top nav + company / research / financial tabs)
    cn.ts         Class-name merge helper
    mock/         Labelled sample data (companies, financials, documents, timeline)
```

The financial workspace lives at `app/financials` (overview + income-statement,
balance-sheet, cash-flow, metrics, historical-trends, quarterly, annual). The
reusable component library is documented in
[`docs/00-foundation/ui-component-library.md`](../../docs/00-foundation/ui-component-library.md).

Old Sprint 000 routes (`/dashboard`, `/company`) now redirect to `/` and
`/companies` (see `next.config.mjs`).

## Design direction

Institutional research terminal: dark-first, dense, dashboard-oriented, calm
amber accent on deep slate. Theming is driven entirely by CSS variables in
`app/globals.css`; a `.light` class on `<html>` flips to the light theme, so the
shell is dark-mode ready without a hardcoded palette.

## Conventions

- No business logic in UI components (per the Atlas Development Standard).
- The API is reached only through `NEXT_PUBLIC_API_BASE_URL` — no hardcoded hosts.
- This app is self-contained. Monorepo root wiring (workspaces, root CI) is owned
  by the backend foundation task (Issue #1).
