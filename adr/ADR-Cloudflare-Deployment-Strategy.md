# ADR: Cloudflare Deployment Strategy (ATLAS-DEPLOY-P001, Phase 1)

- **Status:** Accepted (first deploy)
- **Date:** 2026-07-05
- **Owners:** Claude Code (frontend) + Codex (backend)
- **Program:** Issue #22 — ATLAS-DEPLOY-P001

## Context

Atlas must be deployed to Cloudflare early so routing, build output, static/
dynamic rendering, env vars and asset paths are validated in a production-like
environment, not only on localhost. Today `apps/web` is **mock-only**: no server
data fetching, no API routes, no server actions, no `cookies()`/`headers()`, no
ISR. All interactivity is client-side (command palette, tabs, dropdown, toast,
sort/search, dialogs, theme/density). The backend (P004+) is not yet merged.

## Decision

**Deploy `apps/web` as a Next.js static export (`output: "export"`) to
Cloudflare Pages.**

- `next build` emits a fully static `out/` directory (HTML + `_next` assets).
- Dynamic routes are pre-rendered with `generateStaticParams`: reports (9) and
  every company in the sample universe (6 × sub-pages).
- Runtime `redirects()` are unsupported by static export, so legacy redirects
  (`/dashboard`, `/company`, bare `/companies/:id`) move to `public/_redirects`
  (Cloudflare Pages honours it).

## Why this over the alternatives

- **Static export → Pages (chosen):** zero runtime, no cold starts, cheapest,
  simplest, and it deploys the *exact* client bundle users run. Perfect while the
  app is client-rendered over mock data. Validated: all routes serve 200 with
  clean URLs, fonts embed, client hydrates (command palette works), 0 console
  errors, `_redirects` + `404.html` present.
- **`@opennextjs/cloudflare` (Workers) — deferred:** the right target **once the
  backend lands** and we need SSR, server data fetching or Node runtime. Migration
  is config-level (adapter + `wrangler`), no component changes, because data
  already flows through the `Resource → DataState` seam.
- **`@cloudflare/next-on-pages` — rejected:** superseded by OpenNext for Next.js
  on Cloudflare; no reason to adopt it for an interim step.

## Consequences

- **Positive:** live URL in minutes, continuous preview per PR, no runtime
  compatibility risk, trivial rollback (Pages keeps every deployment).
- **Trade-offs:** no SSR/server data (not needed yet); redirects live in
  `_redirects` not `next.config`; when SSR is required we migrate to OpenNext.
- **Follow-up:** Phase 3 (backend/API host) is Codex's; Phase 4 (env parity) and
  Phase 5 (CI gating) build on this.

## Migration trigger

Move to `@opennextjs/cloudflare` when any of: real server data fetching, server
actions, per-request rendering, or Node-only runtime is required.
