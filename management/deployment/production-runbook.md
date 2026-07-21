# Atlas Production Runbook — Cloudflare + Supabase + Claude

Everything below needs **your credentials** and interactive auth, so it runs on
your machine / in your dashboards, not in an agent session. After this, Atlas
is publicly live: web on Cloudflare Pages, API on a Cloudflare Worker, data in
Supabase Postgres, AI analyst powered by Claude.

## 0. Prerequisites (once)

```bash
npm install -g wrangler
cd Desktop/Atlas && git checkout main && git pull && npm install
wrangler login          # opens a browser → authorise your Cloudflare account
```

## 1. Database — Supabase Postgres

You already created the project (`fsbcltowqpfniodzaslo`). Load the schema + data:

1. Open **Supabase dashboard → your Atlas project → SQL Editor → New query**.
2. Run these files **in order** (open each in `apps/api`, paste, Run):
   1. `apps/api/drizzle/0000_init_postgres.sql`   ← creates all tables
   2. `apps/api/drizzle/0001_agent_usage.sql`     ← agent rate-limit table
   2. `apps/api/seed/seed.sql`                     ← AI-infra companies
   3. `apps/api/seed/edgar/edgar-seed.sql`         ← SEC EDGAR facts
   4. `apps/api/seed/glove/glove-seed.sql`         ← glove quarterlies
   5. `apps/api/seed/glove/industry-metrics.sql`   ← ASP / NBR series
   6. `apps/api/seed/graph/graph-seed.sql`         ← relationships

   All seeds are idempotent (upserts), so re-running any file is safe.
   (Everything here was verified against a real Postgres engine in CI, so the
   SQL will apply cleanly.)

3. Get the **connection string**: Settings → Database → Connection string →
   **Transaction** (the port **6543** pooler). It looks like:
   `postgresql://postgres.fsbcltowqpfniodzaslo:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`

## 2. Secrets — set on the Worker (never in code)

```bash
cd apps/api
wrangler secret put DATABASE_URL         # paste the Transaction pooler URL from step 1.3
wrangler secret put ANTHROPIC_API_KEY    # paste your Claude key (console.anthropic.com)
# optional: wrangler secret put AGENT_MODEL   (default claude-sonnet-5)
```

Hardening vars (plain vars, can also go in `wrangler.toml` `[vars]`):

```bash
# Lock CORS to the web app once the Pages domain exists (comma-separated):
wrangler secret put ALLOWED_ORIGINS      # e.g. https://atlas-web.pages.dev
# Agent quota per IP per day (default 50):
wrangler secret put AGENT_DAILY_LIMIT    # e.g. 50
```

**Login (decided 2026-07-21 — Option A):** after the Pages deploy, enable
**Cloudflare Access** on the Pages domain: dashboard → Zero Trust → Access →
Applications → Add → Self-hosted → domain = the Pages URL → policy = allow
your email (One-time PIN). Phone browsers included; no code change.

> Security: because the DB password was shared in chat, rotate it after setup
> (Supabase → Settings → Database → Reset database password), then re-run
> `wrangler secret put DATABASE_URL` with the new string.

## 3. Deploy the API Worker

```bash
cd apps/api
wrangler deploy
# note the URL, e.g. https://atlas-api.<subdomain>.workers.dev
# smoke test:
curl https://atlas-api.<subdomain>.workers.dev/v1/companies/nvidia/score
curl https://atlas-api.<subdomain>.workers.dev/v1/agent/status   # {"configured":true,...}
```

If a request errors, check `wrangler tail` — the most likely cause is the
`DATABASE_URL` (must be the **Transaction** pooler, port 6543, `prepare:false`
is already set in code).

## 4. Deploy the web app (Cloudflare Pages)

Set the API URL as a **build-time** variable and deploy the static export:

```bash
cd apps/web
NEXT_PUBLIC_API_BASE_URL=https://atlas-api.<subdomain>.workers.dev npm run build
wrangler pages deploy out --project-name=<your-pages-project>
```

(Or set `NEXT_PUBLIC_API_BASE_URL` in the Pages project's dashboard env vars and
let Pages build from GitHub.)

Open the Pages URL → Home shows live coverage, `/agent` chat is active.

## 5. (Optional) Private access / "login"

The app has no built-in login (single-user design). To gate the whole site to
just you, use **Cloudflare Zero Trust → Access**: add an Access application for
the Pages domain, policy = your email only. Visitors get an email-code login
before the site loads. No code changes.

## Verification checklist

- [ ] `curl .../v1/scores` returns the ranked universe (Arista 95 …)
- [ ] `curl .../v1/companies/nvidia/financials` shows FY23–FY26
- [ ] Web Home shows "17 companies", `/agent` answers a question
- [ ] (if enabled) Cloudflare Access prompts for your email

## Still blocked on external resources

- **P027 live quotes** — a market-data API key (`MARKET_DATA_KEY`).
- **P028 trading** — a broker account + an always-on `trading-bridge` host.
