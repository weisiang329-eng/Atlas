# Atlas Data & Table Conventions v0.1

> docs/design/00-data-conventions.md · grounded in `apps/web/components/data/data-table.tsx`,
> `filter-bar.tsx`, `search-input.tsx` (current code — read, not assumed).
> Companion to `00-visual-refresh.md`. Fills the gap: date/number format, and the
> full sort/filter/search/column feature matrix, spelled out per capability.

## 0. What exists today vs what this doc adds

| Capability | Today (real code) | This doc |
| --- | --- | --- |
| Search | ✅ substring, all columns, client-side (`DataTable searchable`) | standardizes placeholder copy + debounce |
| Sort | ✅ single column, asc→desc→none, numeric or locale-string (`toggleSort`) | adds multi-column (shift-click) as v2 |
| Filter | ✅ segmented `FilterBar` (single active value) | adds multi-select chip filters as v2 |
| Pagination | ✅ client-side, Prev/Next, page size prop | unchanged |
| Column resize/reorder/pin/hide | ❌ none | **new** — v2 addition, spec below |
| Date format | ❌ none — raw strings per mock (`"FY24"`, `"2026-06-30"`) | **new** — `lib/format.ts` |
| Number/currency format | ⚠️ ad-hoc `toLocaleString("en-US")` inline per file | **new** — `lib/format.ts`, one source of truth |

## 1. Number format (`lib/format.ts`, new file)

- **Integers/figures:** `formatNumber(v)` → `en-US` grouping, no forced decimals
  (`12,480,400`). Negative → parentheses, not minus (`(1,220)`), per
  `StatementTable`'s existing rule — now centralized.
- **Currency:** `formatCurrency(v, ccy='USD')` → `$12,480,400`; non-USD shows
  ISO code suffix (`RM 3,200,000` for MYR — Bursa subjects).
- **Percent:** `formatPercent(v, decimals=2)` → signed (`+1.82%` / `-0.63%`),
  decimals fixed per context (prices 2dp, ratios 1dp, deltas 2dp).
- **Compact:** `formatCompact(v)` → `$1.82M` / `$12.4B` for KPI tiles only, never
  in table cells (tables always show full figures — this is a report/terminal,
  not a marketing tile).
- **Glyph rule (unchanged):** all of the above render via `.num` (Plex Sans +
  tabular-nums) — plain zero, never Plex Mono for the digits themselves.
- **Ratios/multiples:** `formatMultiple(v)` → `1.28x`.

## 2. Date & time format (`lib/format.ts`)

- **Absolute date (tables, reports):** `formatDate(d)` → `2026-06-30` (ISO,
  unambiguous — never `MM/DD/YYYY`, avoids US/international ambiguity for a
  platform with US + Malaysian subjects).
- **Fiscal period labels:** kept as domain strings from the backend (`"FY24"`,
  `"Q2 FY24"`) — not reformatted, they're identifiers, not dates.
- **Timestamp (quotes, audit log):** `formatDateTime(d)` → `2026-07-21 09:41:22`
  + a separate tz-aware variant for the Markets topbar (`09:41:22 NY`).
- **Relative (alerts, "last sync"):** `formatRelative(d)` → `2 分钟前` / `2m ago`
  (locale-aware; falls back to absolute after 24h).
- Every date/time value in the UI must go through one of these four — no
  inline `toLocaleDateString()` calls in components.

## 3. Search (existing `DataTable searchable` — standardize usage)

- Debounce 150ms before filtering (currently synchronous per keystroke —
  fine at current row counts; add debounce when any table exceeds ~2k rows).
- Placeholder copy pattern: `"Search {entity}…"` (e.g. "Search holdings…"),
  always via `searchPlaceholder`, never the generic default in a real table.
- Result count always shown via `FilterBar`'s `right` slot: `"{n} / {total}"`.
- Search matches every column's rendered/sort value (already the behavior via
  `sortAccessor` fallback) — no hidden unsearchable columns.

## 4. Sort (existing single-column — v2 multi-column)

- v1 (shipped): click header → asc → desc → none; `aria-sort` wired; numeric
  columns compare numerically, everything else locale-compares strings.
- **v2 addition:** shift-click adds a secondary sort key (stable multi-sort);
  header shows `1▲ 2▼` rank badges. Only add when a real table needs it
  (e.g. Positions: class then weight) — don't add speculatively elsewhere.
- Default sort per table must be specified explicitly by the page (e.g.
  Positions defaults to weight desc, Alerts to fired_at desc) — never rely on
  raw API order.

## 5. Filter (existing single-select `FilterBar` — v2 multi-select)

- v1 (shipped): segmented control, one active value (e.g. Positions asset-class
  chips). Use for ≤6 mutually-exclusive options.
- **v2 addition:** multi-select chip group (`FilterOption[]` with array active
  state) for non-exclusive filters (e.g. Markets sector + region together);
  new component `MultiFilterBar`, same visual language, checkbox chips.
- Filters never call the backend per keystroke/click for client-paginated
  tables (filter client-side, matching current architecture); server-side
  filtering only for tables backed by paginated endpoints (e.g. Alerts at
  scale) — page must say which mode it uses.

## 6. Column features — v1 (shipped) vs v2 (new spec)

**v1 — shipped, keep using as-is:** fixed column set per table, `numeric`/
`align` props, custom `render`, `sortable` per column, `className` escape hatch.

**v2 — column resize / reorder / pin / hide (new, for dense tables: Positions,
ERP orders, Alerts, Board risk register):**
- `columnVisibility` state (localStorage-persisted per table id) + a
  "Columns" popover (checkbox per column) — hidden columns excluded from
  search/sort entirely.
- `pinnedKeys: string[]` — pinned columns get `sticky left` with a border-strong
  edge (same sticky mechanism the label column in `StatementTable` already
  uses).
- Reorder: drag column header (native HTML5 DnD, no library) → persists to
  same localStorage key as visibility.
- Resize: drag right edge of header → `colgroup` width persisted; min-width
  120px; numeric columns min-width 80px.
- New component `DataTable` prop additions (backward-compatible):
  `tableId` (required for persistence), `defaultPinned?`, `columnMenu?: boolean`.

## 7. Rollout

1. Ship `lib/format.ts` (Batch 3, this doc) — replace inline formatting call
   sites in `StatementTable`, `ResultsTable`, KPI tiles, one PR, no behavior
   change to existing output (values already matched this spec informally).
2. Wire `formatRelative`/`formatDateTime` into P027 quotes ("last sync"),
   P011 alerts ("fired_at"), P024 job runs.
3. Column v2 (resize/reorder/pin/hide) ships with whichever of Positions/ERP
   orders/Alerts needs it first — don't build speculatively across all tables.
4. Multi-column sort and multi-select filter: same rule, ship where a real
   table needs it (Positions is the first candidate for both).

## Acceptance

No raw `toLocaleString`/`toLocaleDateString` call sites remain outside
`lib/format.ts`; every table's default sort is explicit in its page; every
date/number in a screenshot review renders through this spec (plain zero,
ISO dates, parenthesized negatives).
