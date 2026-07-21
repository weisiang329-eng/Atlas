# Atlas — Design System

**The single source of truth for how Atlas looks and behaves.** If a screen
disagrees with this file, the screen is wrong.

Aesthetic direction: **Aurora Glass** (dark, precise, institutional). The
reference points are the terminal and the financial broadsheet, not the
consumer dashboard. Premium here comes from *precision* — perfect numeric
alignment, one date format, hairline structure, colour that only ever carries
meaning — not from decoration.

---

## 0. The five rules

1. **Colour means something.** Accent = interactive or emphasised. Green/red =
   direction of money. Everything else is a neutral surface. Never colour for
   decoration.
2. **Numbers are typeset, not just printed.** Every figure uses tabular
   numerals, is right-aligned in tables, and keeps a fixed decimal count down
   its column.
3. **One date format per context**, listed in §3. Never invent a new one.
4. **Structure with hairlines and elevation, not boxes inside boxes.** Maximum
   one nesting level of panels.
5. **Motion is fast and functional.** 120–180ms, ease-out. Nothing bounces.

---

## 1. Typography

Four faces, each with one job. IBM Plex throughout — a family designed for
technical density with a true monospace and a genuine serif.

| Face | Token | Used for | Never used for |
| --- | --- | --- | --- |
| **Plex Serif** | `font-serif` | Page titles, panel headings, the Atlas Score figure | Body copy, numbers in tables |
| **Plex Sans** | `font-sans` | All body copy, labels, buttons, table text | Tickers |
| **Plex Sans + `tabular-nums`** | `.num` | **Every figure**: prices, quantities, percentages, dates in tables, scores | Prose |
| **Plex Mono** | `font-mono` | Tickers, eyebrow labels, column headers, code, IDs | Long text, figures |

### The text-vs-numeral rule (the one that matters most)

```tsx
<span>Revenue grew strongly</span>              {/* prose  → sans        */}
<span className="num">215,938</span>            {/* figure → tabular     */}
<span className="font-mono">NVDA</span>         {/* ticker → mono        */}
<h2 className="font-serif">Rankings</h2>        {/* heading→ serif       */}
```

`.num` is Plex Sans with `font-variant-numeric: tabular-nums` and a **plain
zero** (no slash or dot). Tabular means every digit occupies the same width, so
a column of figures aligns on the decimal without any extra work — the single
biggest visual difference between a professional financial UI and an amateur
one.

**Never** set figures in Plex Mono. Mono digits are wider and lighter than
Plex Sans tabular digits and make dense tables look like a code listing.

### Scale

| Role | Size / weight | Notes |
| --- | --- | --- |
| Page title | `text-2xl` serif 600 | One per page |
| Panel title | `text-sm` sans 600 | Inside `ChartContainer` / `Panel` |
| Eyebrow | `text-2xs` mono 500, `tracking-[0.08em]`, uppercase, `text-faint` | The system's signature label |
| Body | `text-sm` sans 400 | Default |
| Secondary | `text-2xs` sans, `text-muted` | Supporting detail |
| Table header | `text-2xs` mono uppercase `tracking-[0.08em]` | Always |
| Figure (table) | `text-sm` `.num` | Right-aligned |
| Figure (KPI) | `text-xl`–`text-2xl` `.num` | In `StatGrid` |

---

## 2. Colour

Tokens only — never a raw hex in a component.

| Token | Role |
| --- | --- |
| `--bg` | Page canvas |
| `--surface` | Panels |
| `--surface-2` | Hover, raised rows |
| `--surface-3` | **Inset wells** — chart plots, inputs, nested detail |
| `--border` / `--border-soft` / `--border-strong` | Hairline structure, three weights |
| `--accent` | Interactive, emphasis, the active state |
| `--positive` / `--negative` / `--warning` | **Direction of money only** |
| `--fg` / `--muted` / `--faint` | Text, three levels |

**Semantic colour discipline:** green and red mean gain and loss. They never
mean "success" or "error" in a financial context — a failed import is
`--warning` with an icon, not red, so red always reads as "lost money".

### Elevation

Three levels, no more: flat (`bg-surface`), panel (`shadow-panel`), floating
(`shadow-pop` — menus, drawers). `shadow-glow` is reserved for live-updating
accent data.

---

## 3. Dates and numbers — the canonical formats

All of these live in `lib/format.ts`. **Import them; never hand-roll a format.**

### Dates

| Context | Format | Example | Function |
| --- | --- | --- | --- |
| **Tables, data, timestamps** | `YYYY-MM-DD` | `2026-07-21` | `fmtDate` |
| **Prose, headers, cards** | `D MMM YYYY` | `21 Jul 2026` | `fmtDateLong` |
| **With time** | `YYYY-MM-DD HH:mm` | `2026-07-21 14:32` | `fmtDateTime` |
| **Feeds, activity** | relative | `2h ago` / `3d ago` | `fmtRelative` |
| **Month** | `MMM YYYY` | `Jul 2026` | `fmtMonth` |
| **Fiscal period** | as filed | `FY26`, `Q3 FY26` | never reformat |

ISO in tables is deliberate: it is unambiguous across MY/US/HK conventions,
sorts correctly as a string, and is the same width for every row — which
matters because dates sit in `.num` columns.

Fiscal period labels come from filings and are **never** translated or
reformatted. `FY26` is an identifier, not a date.

### Numbers

| Kind | Rule | Example |
| --- | --- | --- |
| Quantity | Thousands separated, 0 dp | `1,200` |
| Price | 2–4 dp, **consistent within a column** | `12.4500` |
| Money | Currency code prefix, 2 dp | `RM 3,282.00` · `USD 1,450.25` |
| Percent | 1 dp, `%` suffix | `75.0%` |
| Multiple | 2 dp, `x` suffix | `1.85x` |
| Change | **Signed**, coloured | `+12.4%` / `−3.1%` |
| Compact | Only where space forces it | `1.2M` |
| **Missing** | **Always `—`** | never `0`, `N/A`, or blank |

Negative numbers use a **minus sign and `--negative`**, not accounting
parentheses: on screen, colour reads faster than punctuation. Parentheses are
kept for printed statements only.

Percentages and multiples never carry a currency. Money always states its
currency — Atlas is multi-currency, so a bare figure is ambiguous.

---

## 4. Table controls — sorting, filtering, columns

One implementation, used by every table. Behaviour is uniform so a user learns
it once.

### Sorting

- Any sortable header is a **button**; the whole header cell is the target.
- Cycle: **ascending → descending → unsorted**. The third state matters — it
  restores the natural order (usually the data's own ranking).
- The indicator is always present: `↕` when unsorted (at `--faint`), `▲`/`▼`
  when active (at `--fg`). A hidden affordance is not an affordance.
- `aria-sort` is set on the `<th>` — required, not optional.
- Numeric columns sort numerically, text columns by locale compare. Missing
  values (`—`) always sort last, in both directions.

### Filtering

- The `FilterBar` sits **inside the panel, above the table**, never floating.
- Search filters across all visible column values, case-insensitive,
  debounce-free (client-side, the datasets are small enough).
- The row count is always displayed as `shown / total` — the user must be able
  to see that a filter is active without re-reading their own input.
- Facet filters (market, grade, side) are pill toggles, multi-select, with an
  explicit "All" that is the default.

### Columns

- The **column picker** is a dropdown in the panel header. Toggling is instant
  and persists per table in `localStorage`.
- The first column is the row's identity and **cannot be hidden** — a row must
  always be identifiable.
- Hidden columns still participate in search (a user searching a value they
  cannot see should still find the row).
- **Not used on statement tables** whose columns are fiscal periods
  (`company-financials-live`, `live-sections`, `results-table`). Their column
  set changes as new periods are filed, so a persisted "hidden" list would
  silently start hiding the wrong years. Period selection there belongs to a
  period control, not a column picker — a deliberate exclusion, not an
  oversight.

### Density and responsive behaviour

- Row padding follows the global density setting (`--cell-py`).
- Below `sm`, primary lists switch to **stacked cards** (`mobileCards`); dense
  reference tables (financial statements) keep horizontal scroll, because
  period-over-period comparison is the point of those tables.

---

## 5. Components — the fixed vocabulary

| Need | Component | Never |
| --- | --- | --- |
| Framed content | `ChartContainer` (title + subtitle + actions + status) | A hand-rolled div with a border |
| Plain panel | `Panel` / `PanelHeader` / `PanelBody` | — |
| KPI row | `StatGrid` | A grid of custom cards |
| Any table | `DataTable` | A raw `<table>` |
| Status word | `Badge` | A coloured span |
| Nothing yet | `EmptyState` | Blank space |
| Data doesn't exist | `PlannedModule` | A fake table |
| Loading | `Skeleton` family | A spinner |
| Page header | `PageHeader` | A bare `<h1>` |

Every async view goes through `<DataState>`: skeleton → error → empty → data.
No view is allowed to render nothing while it waits.

---

## 6. Motion

| Interaction | Duration | Easing |
| --- | --- | --- |
| Hover / colour | 120ms | ease-out |
| Expand / collapse | 160ms | ease-out |
| Drawer / dialog | 180ms | ease-out |
| Price flash | 600ms | linear, then removed |

Everything respects `prefers-reduced-motion`. No bounce, no spring, no
parallax — this is an instrument, and motion that draws attention to itself is
noise between the user and their money.

---

## 7. Layout

- Content max width `max-w-6xl`, centred, with `px-4 sm:px-6 lg:px-8`.
- The workspace rhythm is `gap-6` between blocks, `gap-3` within them.
- Primary rows use `lg:grid-cols-[1.6fr_1fr]` (wide/narrow) or `lg:grid-cols-2`
  (even). Multi-column only from `lg`.
- Mobile: bottom tab bar below `lg`, content reserves `pb-24`, targets ≥44px,
  safe-area respected.

---

## 8. Adding to the system

1. Check this document for an existing pattern. Reuse beats invention.
2. If genuinely new, add it **here first**, then implement it.
3. Never introduce a raw hex, a one-off date format, or a bespoke table.
4. A PR that changes a shared component states what else it affects.
