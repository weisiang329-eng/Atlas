# Atlas Production Runbook — Cloudflare + Claude Agent + (optional) Supabase

Everything below needs **your credentials** and interactive auth, so it runs on
your machine, not in an agent session. Each step is a single command. Order
matters top-to-bottom. After this, Atlas is publicly live with the AI analyst.

## 0. Prerequisites (once)

```bash
npm install -g wrangler        # Cloudflare CLI
cd Desktop/Atlas && npm install
wrangler login                 # opens a browser → authorise your Cloudflare account
```

## 1. Database — Cloudflare D1

```bash
cd apps/api
wrangler d1 create atlas-db
# → copy the printed database_id into apps/api/wrangler.toml
#   (replace PLACEHOLDER_CREATE_WITH_wrangler_d1_create)

# Apply schema + all seeds to the REMOTE database:
wrangler d1 migrations apply atlas-db --remote
wrangler d1 execute atlas-db --remote --file=seed/seed.sql                  # AI-infra companies
wrangler d1 execute atlas-db --remote --file=seed/edgar/edgar-seed.sql      # SEC EDGAR facts
wrangler d1 execute atlas-db --remote --file=seed/glove/glove-seed.sql      # glove quarterlies
wrangler d1 execute atlas-db --remote --file=seed/glove/industry-metrics.sql# ASP / NBR series
wrangler d1 execute atlas-db --remote --file=seed/graph/graph-seed.sql      # relationships
```

## 2. Claude agent key — Worker secret

Get a key at https://console.anthropic.com/. It is stored encrypted by
Cloudflare and read only inside the Worker — **never commit it, never paste it
into the app or a browser.**

```bash
cd apps/api
wrangler secret put ANTHROPIC_API_KEY     # paste the key at the prompt
# optional: wrangler secret put AGENT_MODEL   (default: claude-sonnet-5)
```

## 3. Deploy the API Worker

```bash
cd apps/api
wrangler deploy
# → note the deployed URL, e.g. https://atlas-api.<your-subdomain>.workers.dev
# smoke test:
curl https://atlas-api.<subdomain>.workers.dev/v1/companies/nvidia/score
curl https://atlas-api.<subdomain>.workers.dev/v1/agent/status   # {"configured":true,...}
```

## 4. Point the web app at the API + deploy Pages

Set the API URL as a **build-time** env var for the Pages project
(Cloudflare dashboard → Pages → atlas web project → Settings → Environment
variables), then rebuild/deploy:

```
NEXT_PUBLIC_API_BASE_URL = https://atlas-api.<subdomain>.workers.dev
```

```bash
cd apps/web
npm run build            # emits ./out (static export)
wrangler pages deploy out --project-name=<your-pages-project>
```

Open the Pages URL. Home shows live coverage; `/agent` chat is active.

## 5. (Optional) Supabase — agent long-term memory (P021)

The agent works fully on D1 tool-calling without this. Add Supabase only when
you want **semantic memory / RAG** over unstructured research notes (P008/P021)
— pgvector is the reason to reach for Postgres here.

```bash
# In the Supabase dashboard: create a project (your account; note the cost tier).
# Enable the pgvector extension (Database → Extensions → "vector").
# Then store the connection string + service key as Worker secrets:
cd apps/api
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

Schema + client wiring for the memory store land with P021 (see
`management/roadmap/execution-status-2026-07-21.md`). Until then these secrets
are unused — set them only when P021 is built.

## Rollback / re-run

- All seeds are idempotent (upsert), so steps in §1 can be re-run safely.
- `wrangler deploy` / `pages deploy` are atomic; re-run to redeploy.
- Rotate the Claude key: `wrangler secret put ANTHROPIC_API_KEY` again.

## What is NOT here (still blocked on external resources)

- **P027 live quotes** — needs a market-data API key (Polygon/Finnhub) as a
  Worker secret `MARKET_DATA_KEY`.
- **P028 trading** — needs a broker account + an always-on `trading-bridge`
  host (not Cloudflare). See the execution-status doc.
