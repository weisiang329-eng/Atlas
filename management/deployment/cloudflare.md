# Cloudflare Deployment — Atlas Web

Deployment note for ATLAS-DEPLOY-P001. Strategy: **Next.js static export →
Cloudflare Pages** (see `adr/ADR-Cloudflare-Deployment-Strategy.md`).

## Cloudflare Pages project settings

Create a Pages project connected to `weisiang329-eng/Atlas`:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `apps/web` |
| Framework preset | Next.js (Static HTML Export) — or "None" |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node version | `20` (or `22`) |

Preview deployments are automatic for every PR once the repo is connected.

## Environment variables (Pages → Settings → Variables)

Public (build-time, `NEXT_PUBLIC_*` are inlined into the static bundle):

| Variable | Local | Preview | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001` | (backend preview URL) | (backend prod URL) |
| `NEXT_PUBLIC_APP_ENV` | `local` | `preview` | `production` |

No secrets in the frontend. The API is reached only via `NEXT_PUBLIC_API_BASE_URL`.

## Redirects

`apps/web/public/_redirects` (copied to `out/_redirects` on build) handles what
static export can't do at runtime:

```
/dashboard              /              302
/company                /companies     302
/companies/:companyId   /companies/:companyId/overview   302
```

## Environments

- **Local** — `npm run dev` (`apps/web`), `http://localhost:3000`.
- **Preview** — Cloudflare Pages per-PR preview URL.
- **Production** — Pages production URL from `main` (custom domain optional).

## First deploy (owner, one-time)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick `weisiang329-eng/Atlas`.
3. Apply the settings table above (**Root directory `apps/web`**, output `out`).
4. Add the env vars. Deploy.

Result: `https://<project>.pages.dev`. Thereafter every push to `main` deploys
production and every PR gets a preview URL.

## Rollback

Cloudflare Pages keeps every deployment. Roll back via **Pages → Deployments →
… → Rollback to this deployment**. No rebuild needed.

## Local verification of the production artifact

```bash
cd apps/web && npm run build   # emits out/
npx serve out                  # serves the static site with clean URLs
```

Validated: all key routes 200, clean URLs, fonts embedded, client hydration
(command palette) works, `_redirects` + `404.html` present.

## Migration note

When real SSR / server data is needed, migrate to `@opennextjs/cloudflare`
(Workers). App code is unaffected — data flows through `Resource → DataState`.
