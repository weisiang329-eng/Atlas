# P004 — Financial Intelligence Engine

## Owner
Codex Backend + Claude Code Frontend

## Priority
P0

## Mission
Build the reusable financial intelligence layer for Atlas.

This is not only for stocks. The financial domain must eventually support public companies, private companies, ERP financials, manufacturing cost analysis and board reporting.

## Backend Scope

- FinancialStatement
- IncomeStatement
- BalanceSheet
- CashFlow
- FinancialPeriod
- Currency
- ExchangeRate
- FinancialMetric
- FinancialSnapshot
- Ratio Engine foundation
- Historical data model
- API contracts
- Tests
- Documentation

## Frontend Scope

- Financial workspace
- Income statement page
- Balance sheet page
- Cash flow page
- Metrics page
- Historical trends page
- Ratio dashboard
- Financial report blocks
- Tables and chart containers

## Out of Scope

- Final valuation logic
- AI-generated research
- Trading
- Portfolio execution
- Real broker integration

## Definition of Done

- Financial domain is independent from Company but can relate to Company.
- Financial records have source/evidence support.
- UI supports mock financial workflows.
- Documentation updated.
- Tests pass.
