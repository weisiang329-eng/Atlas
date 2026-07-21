# Atlas Visual Refresh v0.2 — IT Hand-off (Batch 1: Token Layer)

**Direction chosen:** 1b — *Aurora Glass* (Linear/Arc refinement, glow charts,
soft elevation). Full spec: `docs/design/00-visual-refresh.md`.

This batch is the **token + form layer** — the foundation the rest of the refresh
builds on. It is **additive and non-breaking**: no token was removed, no
component API changed, no route touched. Dropping these two files in visibly
lifts the whole app (radius, elevation, depth, skeleton/flash/glass utilities,
plain-zero numerals) and everything keeps compiling.

## What deploys (repo variant)

**Batch 1 — token layer.** Replace 1:1 at the same paths:

| File in this hand-off                     | Replaces in repo                 |
| ----------------------------------------- | -------------------------------- |
| `apps/web/app/globals.css`                | `apps/web/app/globals.css`       |
| `apps/web/tailwind.config.ts`             | `apps/web/tailwind.config.ts`    |

**Batch 2 — component visuals (Aurora Glass chart grammar + async states).**
Replacements are API-backward-compatible (existing call sites compile
unchanged); two files are NEW:

| File in this hand-off                                   | Action in repo   |
| -------------------------------------------------------- | ---------------- |
| `apps/web/components/chart/trend-chart.tsx`              | replace — gradient fill + glow line (`glow`, `gradientId` props added) |
| `apps/web/components/chart/sparkline.tsx`                | replace — direction-coloured (`tone` prop, default `auto`) |
| `apps/web/components/chart/bar-series.tsx`               | replace — `tone="semantic"` option for ± return series |
| `apps/web/components/chart/candlestick.tsx`              | **NEW** — OHLC + volume, token colours (P027) |
| `apps/web/components/chart/intraday-chart.tsx`           | **NEW** — 分时 vs prev-close baseline, ± tinted (P027) |
| `apps/web/components/ui/loading-state.tsx`               | replace — skeletons use `.skeleton` shimmer |
| `apps/web/components/ui/kpi-card.tsx`                    | replace — `.num` plain-zero value, `flash` prop |
| `apps/web/lib/use-price-flash.ts`                        | **NEW** — flash-up/down hook for live cells |

No new dependencies. Stack is unchanged: Next.js 15 static export
(`output: "export"`) + Tailwind v3 + IBM Plex via `next/font`.

## Deploy (unchanged from your current flow)

```bash
cd apps/web
npm run build          # emits out/
# Cloudflare Pages (your existing project):
npx wrangler pages deploy out
# or push to the branch wired to Pages CI
```

`public/_redirects` and `next.config.mjs` are untouched.

## What's new (all token-only, referenced by class/var — never raw hex)

- **4th depth:** `--surface-3` / `bg-surface-3` — inset wells (chart plots,
  inputs, quote blocks). Border tiers `border-soft` / `border-strong`.
- **Form:** `rounded-panel` now `0.75rem`; `rounded-pill`; refined
  `shadow-panel`, plus `shadow-pop` (menus/drawers) and `shadow-glow` (accent
  live-data emphasis).
- **Async:** `.skeleton` (shimmer, reduced-motion safe), `--skeleton-*` tokens.
- **Live data:** `.flash-up` / `.flash-down` (600 ms price-flash, reduced-motion
  safe) — ready for the P027 quotes cells.
- **Glass:** `.glass` translucent surface utility for floating chrome.
- **Numerals:** `.num` utility = Plex Sans + `tabular-nums` (**plain zero**, no
  dot/slash). Apply to every figure/number column. Plex Mono stays for tickers,
  eyebrow labels and code only.
- **Light + print:** every new token has a `.light` value and a print value.

## Usage cheatsheet for the component pass

```tsx
// card / panel
<div className="rounded-panel border border-border bg-surface shadow-panel">
// inset well (chart plot, input)
<div className="rounded bg-surface-3 border border-border-soft">
// number column
<span className="num tabular-nums">{v}</span>
// loading
<div className="skeleton h-4 w-24" />
// price flash (toggle class on new tick, then remove after 600ms)
<td className={dir > 0 ? "flash-up" : dir < 0 ? "flash-down" : ""}>
```

## Status by module — spec vs real code

Design docs (`docs/design/`) cover all 24 modules (P003–P028) to architecture
depth. **Real, working `.tsx` frontend code** — the HouzsERP-level fidelity —
is a separate, much larger effort and is being built **module by module**,
matching the real repo components exactly (not invented). Honest status:

| Module | Design doc | Real frontend code |
| --- | --- | --- |
| Visual refresh (tokens + chart/async primitives) | ✅ | ✅ Batch 1–2 |
| P027 Markets | ✅ | ✅ `app/markets/*`, `components/markets/*` |
| P011 Watchlist + Alerts | ✅ | ✅ `app/watchlist/*`, `app/alerts/*`, `components/alerts/*` |
| P012 Portfolio | ✅ | ✅ `app/portfolio/*`, `components/portfolio/*`, `components/chart/donut.tsx` |
| P010 Scores | ✅ | ✅ `app/scores/*`, `components/scores/*` |
| P008 Decision Journal | ✅ | ✅ `app/research/decision-journal/page.tsx` (drop into existing `/research` layout) |
| P006 Industries (含 P026 手套迁移形状) | ✅ | ✅ `app/industries/*`, `components/industries/*` |
| P009 Invest Workbench (Home) | ✅ | ✅ `app/page.tsx` (replaces Sprint 000 sample) + `lib/mock/workbench.ts` |
| P007 Knowledge Graph | ✅ | ✅ `app/knowledge/page.tsx`, `components/knowledge/relations-list.tsx` |
| P028 Trading (paper) | ✅ | ✅ `app/trading/*`, `components/trading/{order-ticket,orders-table}.tsx` — manual-confirm hard rule built into the component, not just the doc |
| Industry primers (P006 addition) | — | ✅ `components/industries/industry-primer.tsx` + `lib/mock/industry-primer.ts` |
| P018 CEO Dashboard | ✅ | ✅ `app/ceo/*`, `lib/mock/ceo.ts` |
| P014 ERP Intelligence | ✅ | ✅ `app/erp/*`, `lib/mock/erp.ts` — revenue-by-month, customer concentration (HHI), SKU margin |
| P019 Board Intelligence | ✅ | ✅ `app/board/*`, `components/board/risk-matrix.tsx`, `lib/mock/board.ts` |
| P015 Manufacturing / P016 Procurement / P017 Warehouse | ✅ | ✅ `app/erp/{manufacturing,procurement,warehouse}/page.tsx` + `lib/mock/erp-ops.ts` |
| P020 Agents / P022 Ingest / P024 Automation | ✅ | ✅ `app/agents/page.tsx`, `app/admin/{ingest,automation}/page.tsx` + `lib/mock/ops.ts` |
| P021 Memory / P023 Learning | ✅ | ✅ `app/knowledge/memory/page.tsx`, `app/research/learning/page.tsx` + `lib/mock/learning.ts` |
| P025 Atlas 1.0 (users/audit) | ✅ | ✅ `app/admin/page.tsx` + `lib/mock/admin.ts` (replaces stub) |
| P005 company overview (关系面板) | ✅ | ✅ `app/companies/[companyId]/overview/page.tsx` — adds P007 relations panel |
| P013 Reports | ✅ | ✅ **already functional in the repo** (`ReportsBrowser` + `REPORT_INDEX`) — no rewrite needed |
| Company profile / timeline | — | ✅ **already real in the repo** (getMockCompany / Timeline) |
| Company products / management | — | ⛔ **intentionally left as placeholder** — `lib/mock/companies.ts` are REAL companies and the repo rule is "no fabricated fundamentals for real companies"; these correctly stay `—` until the real backend. Fabricating them would break that policy. |

**Conclusion:** every module that *should* have frontend now does — either delivered
in this hand-off or already present/working in the repo. The two remaining
placeholders are a deliberate data-integrity choice, not a gap.

## Added after main delivery

- **`00-mobile-responsive.md`** — binding mobile/phone spec (one responsive
  codebase; breakpoints; table→card pattern; per-screen phone notes). Atlas is
  already responsive via `AppShell`+`MobileNav`; this locks phone quality.
- **P029 News Intelligence** — `docs/design/P029-*.md` + real frontend
  `app/news/page.tsx`, `components/news/news-feed.tsx`, `lib/mock/news.ts`:
  tagged feed, filter by category/country/priority + search, URGENT push banner.
- **`Atlas (standalone).html`** — self-contained 托管版: open in any browser, no
  toolchain (the working investment prototype; pre-token-refresh visuals).

> **Repo reality (audited 2026-07-21):** there is **no `apps/api` in the repo** —
> no backend exists yet, so nothing is "backend without frontend". Every route
> already has a page; the "planned" ones (`alerts`, `watchlist`, `portfolio`,
> `industries`, knowledge/research subpages, `admin`) were ~600-byte
> placeholder stubs. This hand-off's pages **replace those stubs with real UI**.
> Remaining stubs to upgrade: `/reports` + `[reportId]` (needs the real
> `ReportLayout` props read first), company detail subpages (9), and the
> not-yet-created enterprise routes (`/erp` and children, P014–P017) + Stage-4
> admin/agents. Those are the next targets.

**Batch 4 (this delivery) adds, on top of Batch 3:**
- `components/chart/donut.tsx` — new reusable donut/ring chart
- `lib/mock/{watchlist,portfolio,scores,decisions}.ts` — fictional, labelled sample data (never fabricates figures for the real 17 EDGAR/Bursa companies)
- `lib/nav.ts` — Scores entry added, Watchlist/Alerts/Portfolio flipped from `soon` to real
- Full working pages: `/watchlist`, `/alerts`, `/portfolio`, `/scores`, `/research/decision-journal`

Everything above compiles against the real component APIs (`DataTable`,
`WorkspaceLayout`, `ChartContainer`, `StatGrid`, `Badge`, `FilterBar`) as read
from the repo — not invented signatures.

## Standalone variant (托管版)

`Atlas Visual Directions.dc.html` is the picked-direction visual reference
(id 1b). A self-contained single-file build is produced per screen as the
component pass lands, for preview/hosting without the toolchain.
