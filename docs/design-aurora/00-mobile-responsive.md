# Atlas Mobile / Responsive Conventions v0.1

> docs/design/00-mobile-responsive.md · grounded in the real shell
> (`app-shell.tsx`, `mobile-nav.tsx`, `tab-nav.tsx`). **Binding rule: every
> screen is designed desktop AND phone from the same code** — Atlas is one
> responsive Next.js app, not two builds. No separate mobile app.

## 0. Why one codebase (not a separate mobile app)

The shell already adapts:
- `AppShell`: `Sidebar` (fixed rail) + scrollable `main` with `px-4 sm:px-6 lg:px-8`.
- `MobileNav`: below `lg` the sidebar is replaced by a hamburger opening the
  shared `Drawer` (focus-trap, Escape, scroll-lock free). Route change closes it.
- `TabNav`: `overflow-x-auto` — sub-tabs scroll horizontally on phone.
- Content grids use `lg:grid-cols-2/3` → collapse to a single column under `lg`.

So "phone version" = the same routes at a narrow viewport, not new pages.

## 1. Breakpoints (Tailwind defaults — do not invent new ones)

| Token | Width | Atlas meaning |
| --- | --- | --- |
| base | <640 | Phone portrait — single column, drawer nav, card-ified tables |
| `sm` | ≥640 | Phone landscape / small tablet — 2-up stat grids allowed |
| `lg` | ≥1024 | Sidebar rail appears; multi-column workspace layouts |
| `xl` | ≥1280 | Wider gutters; no new layout |

Design at **360×780 (phone)** and **1440 (desktop)** as the two reference frames.

## 2. Rules every screen must follow

1. **Layout:** compose with `grid`/`flex` + `gap`; multi-column only at `lg:`
   (`grid gap-6 lg:grid-cols-2`). Never a fixed px width that exceeds ~340px.
2. **Touch targets:** interactive elements ≥ 44×44px on phone. Nav/tab/table-row
   tap areas included. (Current icon buttons are 36px — bump to `h-11 w-11` on
   phone via `h-9 w-9 lg:h-9 ... max-lg:h-11`.)
3. **Tables → cards under `sm`:** `DataTable` currently `overflow-x-auto`
   (horizontal scroll). Acceptable for dense reference tables (financial
   statements), NOT for primary lists (holdings, watchlist, alerts, orders).
   Those must switch to a stacked **card list** below `sm` — see §3.
4. **Type:** never below 14px body on phone; numeric `.num` stays tabular.
5. **Sticky:** `Topbar` sticky; on phone the primary action (e.g. Trading
   "确认送出", "记录决策") pins to a bottom bar within thumb reach.
6. **Charts:** all pure-SVG charts already use `width:100%` + `viewBox` — they
   scale down cleanly; just cap height (`h-40` on phone vs `h-60` desktop).
7. **Drawer/Dialog:** full-width sheet from bottom on phone, side/centered on
   desktop (the repo `Drawer` already supports `side`).

## 3. Responsive table pattern (the one real gap to close)

Add a `mobileCards` mode to `DataTable` (or a sibling `ResponsiveList`): below
`sm`, instead of `<table>`, render each row as a card —

```
<ul class="sm:hidden flex flex-col gap-2">
  <li class="rounded-panel border border-border bg-surface p-3">
    <div class="flex justify-between">     {/* primary + value */}
      <span class="font-mono font-semibold">NVDA</span>
      <span class="num">172.40</span>
    </div>
    <div class="mt-1 flex justify-between text-2xs text-muted">
      <span>{secondary}</span><span class="num text-positive">+1.82%</span>
    </div>
  </li>
</ul>
<div class="hidden sm:block"> {/* existing DataTable */} </div>
```

Apply to: Markets watchlist, Portfolio holdings, Alerts feed (already a card
list — good), Trading orders, Scores ranking. Statement/results tables keep
horizontal scroll (dense financial data reads better wide).

## 4. Per-screen phone notes

- **Home (P009):** stat strip 2-up (`grid-cols-2`), each dashboard card full
  width stacked; movers/alerts as card lists.
- **Markets/Portfolio/Scores:** quote/holding/score rows → card list (§3);
  charts stack under the table; range tabs scroll horizontally.
- **Trading:** Order Ticket full-screen; confirm button pinned bottom.
- **Financials/Statements:** keep wide table + horizontal scroll; add a sticky
  first column (already the pattern in `statement-table.tsx`).
- **CEO/ERP/Board:** KPI grids 2-up; risk matrix stays a fixed 5×5 grid (it's
  small enough); tables → cards.

## 5. Acceptance (add to P025 per-route checklist)

Every route verified at 360px and 1440px: no horizontal page scroll (only
intentional in-table scroll), no clipped text, tap targets ≥44px, drawer nav
works, charts legible, primary action reachable one-thumb. Both dark + light.
