# Redeploying an update (the 2-minute version)

This is for pushing what's already on `main` to the **existing** production
environment. For standing up a brand-new environment (new Supabase project,
first-time secrets), use [`production-runbook.md`](production-runbook.md)
instead — you only ever do that once.

## Why an update is so short

The environment is already provisioned, so the two slow, manual parts of the
full runbook do **not** apply to an update:

- **No Supabase SQL.** The Worker migrates its own database. On its first
  request after a deploy, `apps/api/src/db/migrate.ts` applies every migration
  the live DB is missing (currently `0007`–`0012`), including their idempotent
  data inserts (the industry tree, the driver list, the blocker rows). You do
  not open the Supabase SQL editor for an update.
- **No secrets.** `DATABASE_URL` and `ANTHROPIC_API_KEY` are already set on the
  Worker and survive redeploys.

So an update is just: build the web app, deploy the Worker, deploy the web app.

## Do it

```powershell
# once per terminal session — opens a browser to authorise Cloudflare:
npx wrangler login

# then, from the repo root:
.\scripts\redeploy.ps1
```

The script builds the web bundle with the live API URL baked in (and aborts if
that bake failed — the classic "shipped a dead site" footgun), deploys the
Worker, deploys Pages, then smoke-tests four endpoints including the new
`/v1/news` route. It stops at the first failure rather than shipping half an
update.

## What the owner will see change after this deploy

Everything that currently looks broken on the live site is the **old build**,
not a bug. After this deploy:

- **News page** — real headlines from Yahoo Finance RSS (per covered ticker),
  clicking a headline opens the source article, company chips link into the
  company pages. (No Chinese headlines: coverage has no Chinese companies yet —
  that is a coverage decision, not a bug. See `tasks/HANDOFF.md` §13.3.)
- **Industry tree** — all taxonomy pages resolve (the 14 that used to 404).
- **Scores** — percentile lens alongside the absolute Atlas score.

## If a smoke check fails

- `/v1/news` 500 on the very first hit → the Worker is mid-migration. Wait ~30s
  and re-run `curl https://atlas-api.weisiang329.workers.dev/v1/news?limit=5`.
- Anything else → `cd apps/api && npx wrangler tail` and watch a live request.
  The usual cause is `DATABASE_URL` not being the **Transaction** pooler
  (port 6543); it already is, so this should not happen on an update.

## Manual fallback (if you'd rather not run the script)

```powershell
$env:CLOUDFLARE_ACCOUNT_ID = '27cd35c9d93a9f81daa809d0b800b059'

cd apps\web
$env:NEXT_PUBLIC_API_BASE_URL = 'https://atlas-api.weisiang329.workers.dev'
npm run build
npx wrangler pages deploy out --project-name=atlas-web --branch=main

cd ..\api
npx wrangler deploy
```
