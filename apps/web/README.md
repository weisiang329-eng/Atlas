# Atlas Web

Frontend for the Atlas Intelligence Platform — an institutional research
terminal for AI-native decision intelligence.

This package is the **Sprint 000 frontend foundation** (Issue #2). It ships the
application shell, design system, and placeholder routes only. No product
features (scoring, company database, dashboards with real data, auth) are built
yet — see the Sprint 000 brief in `/tasks/sprint-000-foundation.md`.

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
    layout.tsx          Root layout, fonts, metadata
    globals.css         Tailwind + design tokens (dark default, light ready)
    page.tsx            Overview (home)
    dashboard/page.tsx  Research terminal workspace (placeholder)
    company/page.tsx    Company profile scaffold (placeholder)
  components/
    layout/             App shell: sidebar, topbar
    ui/                 Shared primitives: panel, badge, stat, empty-state
  lib/
    nav.ts              Navigation model (live + planned modules)
    cn.ts               Class-name merge helper
```

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
