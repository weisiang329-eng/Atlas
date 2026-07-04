# Atlas UI Component Library v0.1

The reusable component system behind every Atlas workspace. Built as a design
system, not per-page: pages compose these primitives and never re-implement
tables, charts or states. All components are presentation-only — they render
data they are handed and **never fetch, calculate or embed business logic**.

## Async state model — the API-decoupling boundary

Every data view flows through one component so the transition to real backends
is a status change, not a redesign.

```tsx
<DataState status={status} loading={<TableSkeleton />} empty={…} error={…}>
  {/* ready: render data */}
</DataState>
```

- `ResourceStatus = "loading" | "error" | "empty" | "ready"` (`components/ui/data-state.tsx`).
- Today pages pass `status="ready"` with mock data. When a contract lands, a
  request's derived status feeds the same component — **zero layout change**.
- `LoadingState`, `TableSkeleton`, `ChartSkeleton` (`loading-state.tsx`) — honour
  `prefers-reduced-motion`.
- `ErrorState` (`error-state.tsx`) — plain-language message, optional `onRetry`.
- `EmptyState` (`empty-state.tsx`) — designed "no data" surface.
- Live demonstration: the Financial Overview's "Async states" panel toggles all four.

## Tables (`components/data`)

- **`DataTable<T>`** — generic, typed columns, right-aligned tabular numerics,
  sticky header, row click. **Performance-first**: `pageSize` paginates large
  datasets client-side so only one page is ever in the DOM (demo: 48 quarters).
- **`StatementTable`** — financial statements: label column + one column per
  period, with section headers, indented lines and emphasized totals. Negatives
  render in parentheses and the `negative` colour. Reused across income
  statement, balance sheet and cash flow.
- **`ResultsTable`** — period-row results (revenue → EPS) wrapping `DataTable`;
  keeps column render functions on the client so pages stay server components.

## Charts (`components/chart`)

Dependency-free, pure-SVG, server-rendered (no client JS, no chart library):

- **`ChartContainer`** — framed shell owning title, subtitle, actions slot,
  fixed plot height and `DataState`. Every chart shares this contract.
- **`TrendChart`** — area + line with emphasized endpoint and baseline grid.
- **`BarSeries`** — vertical bars; negatives below the zero baseline.
- **`Sparkline`** — inline micro-trend for table cells / metric tiles.

All expose `ariaLabel` and use `role="img"`; colours come from CSS variables so
they follow the theme.

## Content components (`components/ui`)

- **`Timeline`** — vertical event log (company history, versions, decisions).
- **`DocumentViewer`** — two-pane list + preview shell; preview waits on a
  storage contract.
- **`Panel` / `PanelHeader` / `PanelBody`**, **`PageHeader`**, **`SectionHeading`**,
  **`Badge`**, **`Stat`**, **`PlaceholderTable`**, **`ComingSoon`**.

## Navigation & layout (`components/layout`)

- **`AppShell`** — sidebar + top bar + scrollable workspace.
- **`Sidebar`** — grouped rail (≥`lg`); **`MobileNav`** — hamburger + slide-over
  drawer (<`lg`), closes on route change / overlay / Escape.
- **`TabNav`** — reusable sub-navigation (company, research, financial workspaces).

## Rules

- No API coupling, no business logic, no ratio/valuation math in the UI.
- Reusable components only — no per-feature one-offs.
- Accessibility: table semantics + captions, `role` on charts/alerts, visible
  focus rings, `prefers-reduced-motion`.
- Dark-mode first via CSS-variable tokens (`app/globals.css`); `.light` ready.
- Performance first: server-render by default; client islands only where state
  is needed (pagination, mobile nav, document selection, state preview).
