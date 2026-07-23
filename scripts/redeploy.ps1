# Atlas - one-shot redeploy of an ALREADY-PROVISIONED environment.
#
# This is NOT the fresh-environment runbook (that lives in
# management/deployment/production-runbook.md and only runs once, by hand).
# Use this every time you want to push what's on `main` to production.
#
# What it does NOT need - because the environment already exists:
#   * No Supabase SQL. The Worker self-migrates on its first request
#     (src/db/migrate.ts runs migrations 0007..0012 and their idempotent
#     data inserts). You never open the SQL editor for an update.
#   * No secrets. DATABASE_URL and ANTHROPIC_API_KEY are already set on the
#     Worker and survive redeploys.
#
# The ONE thing this cannot do for you: `wrangler login`. Run that once in
# this terminal first (it opens a browser). Everything below is then automatic.
#
# Usage (from anywhere):
#   pwsh apps\..\scripts\redeploy.ps1          # or just:  .\scripts\redeploy.ps1
#
# Safe to re-run. Stops at the first failure rather than shipping half an update.

$ErrorActionPreference = 'Stop'

# --- fixed facts about the owner's environment (see CLAUDE.md section 7) -------------
$ApiUrl       = 'https://atlas-api.weisiang329.workers.dev'
$WebUrl       = 'https://atlas-web-2yd.pages.dev'
$PagesProject = 'atlas-web'
$env:CLOUDFLARE_ACCOUNT_ID = '27cd35c9d93a9f81daa809d0b800b059'

# repo root = parent of this script's folder
$Repo = Split-Path -Parent $PSScriptRoot
$Api  = Join-Path $Repo 'apps\api'
$Web  = Join-Path $Repo 'apps\web'

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 0. sanity: are we logged in? --------------------------------------------
Step '0/5  Checking Cloudflare auth'
& npx wrangler whoami
if ($LASTEXITCODE -ne 0) {
  throw "Not logged in. Run 'npx wrangler login' in this terminal, then re-run this script."
}

# --- 1. build the web app with the live API URL baked in ---------------------
Step '1/5  Building web (static export, API URL baked at build time)'
Push-Location $Web
$env:NEXT_PUBLIC_API_BASE_URL = $ApiUrl
& npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Web build failed.' }
Pop-Location

# guard against the classic footgun: a build with no API URL ships a dead site
Step '1b/5  Verifying the API URL is actually baked into the bundle'
$baked = Select-String -Path (Join-Path $Web 'out\_next\static\chunks\*.js') `
  -Pattern 'atlas-api\.weisiang329\.workers\.dev' -List -ErrorAction SilentlyContinue
if (-not $baked) { throw 'API URL NOT found in the built bundle - aborting before shipping a dead site.' }
Write-Host 'API URL baked OK.' -ForegroundColor Green

# --- 2. deploy the API Worker (self-migrates the DB on first request) --------
Step '2/5  Deploying API Worker (atlas-api)'
Push-Location $Api
& npx wrangler deploy
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Worker deploy failed.' }
Pop-Location

# --- 3. deploy the web app (Cloudflare Pages) --------------------------------
Step '3/5  Deploying web (Cloudflare Pages, project atlas-web, branch main)'
Push-Location $Web
& npx wrangler pages deploy out --project-name=$PagesProject --branch=main
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'Pages deploy failed.' }
Pop-Location

# --- 4. smoke test the live API ----------------------------------------------
Step '4/5  Smoke-testing the live API'
$checks = @(
  @{ name = 'ranked universe'; url = "$ApiUrl/v1/scores" },
  @{ name = 'nvidia score';    url = "$ApiUrl/v1/companies/nvidia/score" },
  @{ name = 'news feed (new)'; url = "$ApiUrl/v1/news?limit=5" },
  @{ name = 'agent configured';url = "$ApiUrl/v1/agent/status" }
)
$failed = 0
foreach ($c in $checks) {
  try {
    $r = Invoke-WebRequest -Uri $c.url -UseBasicParsing -TimeoutSec 30
    if ($r.StatusCode -eq 200) {
      Write-Host ("  OK   {0,-18} {1}" -f $c.name, $c.url) -ForegroundColor Green
    } else {
      Write-Host ("  WARN {0,-18} HTTP {1}" -f $c.name, $r.StatusCode) -ForegroundColor Yellow
      $failed++
    }
  } catch {
    Write-Host ("  FAIL {0,-18} {1}" -f $c.name, $_.Exception.Message) -ForegroundColor Red
    $failed++
  }
}

# --- 5. done -----------------------------------------------------------------
Step '5/5  Done'
Write-Host "Web:  $WebUrl"
Write-Host "API:  $ApiUrl"
if ($failed -gt 0) {
  Write-Host "`n$failed smoke check(s) did not return 200. If /v1/news is the one" -ForegroundColor Yellow
  Write-Host "failing, give it ~30s (the Worker self-migrates on its first hit) and re-run" -ForegroundColor Yellow
  Write-Host "just the curl. Otherwise check 'npx wrangler tail' from apps\api." -ForegroundColor Yellow
} else {
  Write-Host "`nAll green. Open $WebUrl - the news page now clicks through, scores are live." -ForegroundColor Green
}
