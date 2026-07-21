# Aurora Glass Frontend Adoption + Mobile Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the owner-approved Cloud Design "Aurora Glass" (direction 1b) visual system across the whole web app — hybrid strategy that never regresses live-wired pages to mock — plus a real mobile experience, and close out the launch-hardening handoff items.

**Architecture:** The design deliverable ("Atlas Investment Platform UI (2).zip", vendored design docs now in `docs/design-aurora/`) was built against the pre-#43 mock-only repo. We therefore adopt it in three tiers: (1) token + primitive layer wholesale (additive, non-breaking by design), (2) whole pages only for routes that are mock/placeholder/nonexistent in the repo, (3) visual grammar only for live-wired pages, which keep their `useApiResource → <DataState>` data path untouched. Mobile gets a bottom tab bar + per-page adaptations on top of the same token layer.

**Tech Stack:** Next.js 15 static export + Tailwind v3 + IBM Plex (unchanged). API: Hono on CF Workers + Supabase Postgres via Drizzle (unchanged).

**Owner decisions already made (2026-07-21):**
- Merge #43 + #26 → done (main now has everything; #4 closed, #27–#42 auto-marked merged).
- Frontend strategy: **hybrid** (as above).
- Login: **A — Cloudflare Access** (zero-code; owner enables Access on the Pages domain at deploy time; recorded in HANDOFF §8).
- Mobile: **full overhaul** (bottom tab bar + per-page mobile layouts).

**Ground rules (repo conventions, unchanged):**
- Never fabricate figures for the real 17 companies; sample pages use labelled fictional data.
- All computation server-side; UI renders only.
- Every phase lands as its own PR with CI green (`db:test`, typecheck, web build). Update `tasks/HANDOFF.md` as state changes.
- The zip source is extracted at the executing machine; all copy steps below reference paths relative to the zip root `atlas-handoff/`. If re-extracting: the deliverable is `Downloads/Atlas Investment Platform UI (2).zip`.

---

### Task 1: Docs PR — this plan + vendored design docs + HANDOFF updates

**Files:**
- Create: `management/plans/2026-07-21-aurora-frontend-mobile.md` (this file)
- Create: `docs/design-aurora/*.md` (24 design docs from the zip, verbatim)
- Modify: `tasks/HANDOFF.md` — §8 record login decision A; §12 tick item 1; §13.1 tick merge item

- [x] **Step 1:** Branch `docs/aurora-frontend-plan`, add files, edit HANDOFF.
- [x] **Step 2:** `git commit` → `gh pr create` → merge when green.

### Task 2: Phase 1 hardening — CORS allowlist + agent rate-limit

**Files:**
- Modify: `apps/api/src/index.ts` (CORS block, ~line 38)
- Create: `apps/api/drizzle/0001_agent_usage.sql` (new table)
- Modify: `apps/api/src/db/schema.ts` (agentUsage table)
- Modify: `apps/api/src/routes/agent.ts` (rate-limit guard on `/ask`)
- Modify: `apps/api/scripts/db-test.mjs` (apply new migration; assert upsert increments)
- Modify: `management/deployment/production-runbook.md` (run 0001 migration; optional `ALLOWED_ORIGINS`/`AGENT_DAILY_LIMIT` vars)

- [ ] **Step 1: CORS.** Replace `origin: "*"` with env-driven allowlist (unset ⇒ `*` so local dev and pre-config deploys keep working):

```ts
app.use("*", async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS; // e.g. "https://atlas.pages.dev,https://atlas-xyz.pages.dev"
  return cors({
    origin: allowed
      ? (origin) => (allowed.split(",").map((s) => s.trim()).includes(origin) ? origin : undefined)
      : "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type"],
  })(c, next);
});
```

Add `ALLOWED_ORIGINS?: string` to the `Bindings` type.

- [ ] **Step 2: agent_usage table.** Migration `0001_agent_usage.sql`:

```sql
CREATE TABLE IF NOT EXISTS agent_usage (
  ip text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, day)
);
```

Mirror in `schema.ts` (drizzle `pgTable`). Guard in the `/v1/agent/ask` handler before calling Claude:

```ts
const ip = c.req.header("cf-connecting-ip") ?? "unknown";
const limit = Number(c.env.AGENT_DAILY_LIMIT ?? 50);
const [row] = await db
  .insert(agentUsage)
  .values({ ip, day: sql`CURRENT_DATE`, count: 1 })
  .onConflictDoUpdate({
    target: [agentUsage.ip, agentUsage.day],
    set: { count: sql`${agentUsage.count} + 1` },
  })
  .returning({ count: agentUsage.count });
if (row.count > limit) return c.json({ error: "Daily agent limit reached." }, 429);
```

- [ ] **Step 3: db-test.** Apply 0001 in the PGlite harness; assert two upserts for the same (ip, day) yield count = 2.
- [ ] **Step 4:** `npm run typecheck && npm run db:test` in `apps/api` — both pass.
- [ ] **Step 5:** Commit, PR `feat/api-hardening`, merge when CI green.

### Task 3: Phase 2a — Aurora Glass token + primitive layer

**Files (zip → repo, same relative path unless noted):**

| Zip file | Action |
| --- | --- |
| `apps/web/app/globals.css` | replace |
| `apps/web/tailwind.config.ts` | replace |
| `apps/web/components/chart/trend-chart.tsx` | replace (adds `glow`, `gradientId` props) |
| `apps/web/components/chart/sparkline.tsx` | replace (adds `tone`, default `auto`) |
| `apps/web/components/chart/bar-series.tsx` | replace (adds `tone="semantic"`) |
| `apps/web/components/chart/candlestick.tsx` | NEW |
| `apps/web/components/chart/intraday-chart.tsx` | NEW |
| `apps/web/components/chart/donut.tsx` | NEW |
| `apps/web/components/ui/loading-state.tsx` | replace (`.skeleton` shimmer) |
| `apps/web/components/ui/kpi-card.tsx` | replace (`.num`, `flash` prop) |
| `apps/web/lib/use-price-flash.ts` | NEW |
| `apps/web/lib/format.ts` | NEW — first diff against existing repo formatters (`lib/api/*`, `resource.ts`); if a duplicate helper exists, keep the repo one and re-point zip imports |

- [ ] **Step 1:** Copy files per table on branch `feat/aurora-tokens`.
- [ ] **Step 2:** Diff replaced components vs repo versions — confirm every existing prop/callsite still type-checks (zip claims API-backward-compat; #28–#43 may have drifted — fix forward, never delete a live prop).
- [ ] **Step 3:** `cd apps/web && npm run typecheck && npm run build` — all ~195 pages must export.
- [ ] **Step 4:** Visual smoke in browser (sample mode): Home, a company financials page, style-guide. Check dark + light.
- [ ] **Step 5:** Commit, PR, merge when green.

### Task 4: Phase 2b — new module pages from the zip

**Adopt whole pages (currently mock/placeholder/absent in repo):** `/markets`, `/trading`, `/alerts`, `/erp` + `manufacturing|procurement|warehouse|furniture`, `/ceo`, `/board`, `/agents` (runtime ops — distinct from live `/agent` Claude chat), `/admin` + `ingest|automation`, `/knowledge/memory`, `/research/learning`. Copy their `components/{alerts,board,markets,trading,industries,knowledge/relations-list}` and required `lib/mock/*` modules.

**Explicitly NOT adopted (would regress live pages):** zip `app/page.tsx`, `portfolio`, `scores`, `watchlist`, `knowledge/page`, `companies/[companyId]/overview`, `research/decision-journal`, `industries/*` (zip's static `industries/ai-infrastructure|gloves` would shadow the live dynamic `[industryId]` route — visual reference only).

- [ ] **Step 1:** Branch `feat/aurora-modules`; copy the adopt-list files.
- [ ] **Step 2:** Merge `lib/nav.ts` by hand: keep all repo entries; add Markets, Trading, Alerts (drop `soon`), Enterprise group (ERP, CEO, Board), Agents (ops), Admin subpages per zip nav; disambiguate `/agent` ("Analyst — live Claude chat") vs `/agents` ("Agent runtime — sample").
- [ ] **Step 3:** Every adopted page must render a visible sample-data label (repo convention); verify each imports only `lib/mock/*` fictional data — grep for the 17 real tickers (NVDA/TSMC/TOPGLOV/HARTA…) inside new mocks; remove/rename any real-company fabricated figures.
- [ ] **Step 4:** typecheck + build; fix component-API drift compile errors forward.
- [ ] **Step 5:** Browser spot-check: `/markets`, `/trading`, `/erp`, `/ceo`, `/alerts`.
- [ ] **Step 6:** Commit, PR, merge when green.

### Task 5: Phase 2c — restyle live pages (keep wiring)

Live pages already inherit most of the refresh via Task 3 (tokens + shared primitives). Remaining manual grammar sweep, using zip pages as visual reference only:

- [ ] **Step 1:** Central components first: `components/ui/panel.tsx`, `stat.tsx`, `stat-grid.tsx`, `page-header.tsx`, `filter-bar.tsx`, `badge.tsx`, data table (`components/data/*`) → `rounded-panel border-border bg-surface shadow-panel`, numeric cells get `num tabular-nums`, inset wells `bg-surface-3 border-border-soft`.
- [ ] **Step 2:** Per-page sweep of live pages (Home, Watchlist, Portfolio, Scores, Industries, Knowledge, Companies family, Financials family, Agent): replace any hardcoded old radius/shadow/surface classes with token classes; loading paths must show `.skeleton`.
- [ ] **Step 3:** typecheck + build; browser pass on each live page in sample mode (layout only — data path untouched, so no wiring re-verification needed beyond `<DataState>` rendering).
- [ ] **Step 4:** Commit, PR `feat/aurora-live-restyle`, merge when green.

### Task 6: Phase 3 — mobile overhaul

**Files:**
- Create: `apps/web/components/layout/bottom-tab-bar.tsx`
- Modify: `apps/web/components/layout/app-shell.tsx` (mount tab bar `< md`, content `pb-16` + safe-area)
- Modify: `apps/web/components/layout/mobile-nav.tsx` (becomes the "More" sheet, fed by `NAV_GROUPS`)
- Modify: data table + `chart-container.tsx` + `workspace-layout.tsx` for `< md` behavior

- [ ] **Step 1: BottomTabBar.** 5 fixed slots — Home `/`, Companies `/companies`, Markets `/markets`, Watchlist `/watchlist`, More (opens the existing Drawer with full `NAV_GROUPS`). `fixed bottom-0 inset-x-0 z-40 md:hidden glass border-t border-border`, items `min-h-[44px]`, `pb-[env(safe-area-inset-bottom)]`, active state from `usePathname()`.
- [ ] **Step 2: AppShell integration** — tab bar mounted globally, main content gets bottom padding on mobile; topbar stays for title/search.
- [ ] **Step 3: Tables** — baseline: horizontal scroll container with sticky first column on `< md`; card-list mode for the key list pages (companies, watchlist, scores rankings, portfolio holdings).
- [ ] **Step 4: Charts** — full-bleed width, touch-friendly tooltips, reduced tick density `< md`.
- [ ] **Step 5:** Browser verification at 375×812 on every nav destination; screenshot evidence; fix overflow/tap-target issues found.
- [ ] **Step 6:** Commit, PR `feat/mobile-overhaul`, merge when green.

### Task 7: Phase 4 — handoff refresh + sweep

- [ ] **Step 1:** `tasks/HANDOFF.md`: tick completed §13 items (13.2 CORS + rate-limit, 13.3 alerts/admin now sample UIs, 13.7 nav `soon` flags), add "Aurora refresh landed" section pointing to this plan + `docs/design-aurora/`.
- [ ] **Step 2:** Update `management/roadmap/execution-status-2026-07-21.md` frontend rows.
- [ ] **Step 3:** Delete superseded `tasks/handoff-2026-07-21.md` (§13.7 item) — HANDOFF.md is the single source.
- [ ] **Step 4:** Docs PR, merge. Final verification: fresh `npm run build` on main; open PR list must be empty.

---

## Verification summary

Per-PR gate: `apps/api`: `npm run typecheck && npm run db:test` · `apps/web`: `npm run typecheck && npm run build` (static export completes) · browser smoke (desktop + 375px). Deploy remains owner-gated per `management/deployment/production-runbook.md` — now with Cloudflare Access (login A) and the 0001 migration added.
