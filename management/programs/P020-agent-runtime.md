# P020 — Agent Runtime (Atlas research analyst)

**Status:** v1 delivered (PR) · **Owner:** Claude Code · **Date:** 2026-07-21

## Mission

A Claude-powered analyst inside Atlas that answers questions from the
platform's **real, sourced data** — not from memory or embeddings.

## Architecture (v1)

- **Tools over data, not RAG.** For financial questions, tool-calling against
  the exact D1 facts (scores, statements, relationships, cycles) is more
  accurate than retrieving embedding chunks. `src/agent/tools.ts` exposes six
  read-only tools wrapping existing domain functions: `list_companies`,
  `get_company_financials`, `get_atlas_score`, `get_rankings`,
  `get_relationships`, `get_industry`.
- **Loop.** `src/agent/runtime.ts` runs the Anthropic Messages API tool-use
  loop (max 6 steps): question → Claude → tool calls → execute against D1 →
  results back → final answer. Read-only, so the agent inspects everything and
  mutates nothing.
- **Key handling.** The Anthropic key is the Worker secret `ANTHROPIC_API_KEY`
  (`wrangler secret put`). It is never in source, never returned to the client,
  never logged. Model configurable via `AGENT_MODEL` (default `claude-sonnet-5`).
- **API.** `POST /v1/agent/ask { question }` → `{ answer, trace, steps }`;
  `GET /v1/agent/status` → `{ configured }` for the UI.
- **Guardrails.** System prompt forbids inventing figures and forbids
  personalised investment advice / buy-sell-hold calls — Atlas presents data,
  the user decides.

## Frontend

`/agent` ("Ask Atlas") chat workspace: suggested prompts, question/answer
turns, and the **tools the agent used** shown as badges (transparency). When
the key is unset it shows setup guidance instead of a dead box.

## Verification

Typecheck green; `/v1/agent/status` reports `configured:false` and `/ask`
returns a graceful 503 until the key is set; the six tools wrap already-verified
domain functions; the UI renders the setup state. The live loop runs once the
owner sets `ANTHROPIC_API_KEY` (see `management/deployment/production-runbook.md`).

## v2+

- Streaming responses (SSE) for token-by-token output.
- Long-term memory / semantic search over research notes → Supabase pgvector
  or CF Vectorize (P021).
- Write tools (create research note / decision-journal entry) once P008 lands
  and a write-auth model exists.
- Per-company "explain this score / this move" inline agent actions.

## Stop conditions

Tools stay read-only until an auth + audit model exists. No auto-trading, no
personalised advice. The key never leaves the Worker secret store.
