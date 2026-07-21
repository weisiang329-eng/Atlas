# Atlas Intelligence Platform

> **👋 Taking over this project? Read [`tasks/HANDOFF.md`](tasks/HANDOFF.md) first** —
> it is the single self-contained guide (status, the PR stack, how to deploy,
> what's left) and needs no prior context.

Atlas is an AI-native Decision Intelligence Platform for investment, business strategy, industry research, supply-chain monitoring, ERP intelligence, M&A analysis, and board-level decision support.

## Mission
Build a long-term enterprise intelligence layer that helps leadership answer:

1. What is changing in the market?
2. Which companies, industries, suppliers, customers, and risks are affected?
3. What decision should management consider next?

## First Module
The first production module is **Atlas Invest**, focused on global AI infrastructure research:

- Semiconductors
- GPU / CPU / AI ASIC
- HBM / DRAM / NAND / SSD
- Foundry / packaging
- Networking / optical
- Data centers
- Cooling
- Power / grid / transformers
- Enterprise AI software

## Long-Term Modules

- Atlas Invest
- Atlas Industry
- Atlas ERP Intelligence
- Atlas M&A
- Atlas Board
- Atlas Supply Chain
- Atlas Research OS

## Development Principle
Atlas must be built as a 10-year platform, not a short-term prototype.

Before coding any major module, the team must define:

- Architecture
- Data model
- API contract
- Acceptance criteria
- Testing scope
- Security and audit requirements

## Repository Structure

```text
Atlas/
  docs/              Product, architecture, research, scoring and development docs
  specs/             Formal module specifications
  tasks/             Sprint plans and task briefs for Codex / Claude Code
  prompts/           Versioned prompt library
  agents/            AI agent definitions and workflows
  schemas/           Data schemas, OpenAPI, JSON schema, ERD notes
  apps/              Future application code
  packages/          Shared libraries
  infra/             Deployment, CI/CD, Docker, IaC
  research/          Company and industry research templates
  adr/               Architecture Decision Records
```

## Current Stage
Sprint 000: Foundation.

No business feature should be built before the foundation is complete.
