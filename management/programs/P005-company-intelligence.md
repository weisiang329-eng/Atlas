# P005 — Company Intelligence Engine

**Status:** v1 delivered (PR #32) · **Owner:** Claude Code · **Date:** 2026-07-21

## Mission

Build a company's full picture fast: identity, business, financials, products,
management, ownership, timeline — each fact sourced. Serves the product goal
"a company, 5 minutes to full context."

## v1 delivered (PR #32)

The company workspace already had live financials (P004); v1 lands the
**overview** and **profile** subpages on real data:

- `GET /v1/companies/:id` (existing endpoint) now feeds both pages.
- Overview: real business description + key facts (segment/exchange/ticker/
  country/founded/HQ). Atlas Score / market cap remain honest placeholders
  (P010 scoring, P027 market data).
- Profile: full attribute table, live website link, cross-link to the
  company's industry workspace (P006).
- Degrades honestly: identity from the static universe when API-less; unseeded
  attributes render `—`, never fabricated. Verified NVDA (full) + Top Glove
  (identity + MYR + industry link, rest `—`).

## v2 (next)

- Products subpage: `company_product` table (segments, product lines, revenue
  mix where disclosed).
- Management subpage: `company_management` (board + executives).
- Ownership: `company_listing` / major holders.
- Employee count, logo, fiscal-year-end; richer thesis block (needs P008
  research/decision module).
- Ingestion: pull profile fields from filings / official sources (extends P022)
  rather than the manual seed.

## Dependencies

Reads `company` table (P003/P004) + industry cross-link (P006). Feeds the
company workspace shell (UI P003). No new schema in v1.

## Stop conditions

v1 is presentation-only over existing data. New company attributes require a
schema migration + a seeded/ingested source, never hardcoded in the UI.
