# Sprint 000 — Foundation

## Goal

Create the technical and documentation foundation for Atlas before any product feature development.

## Owners

- Product Owner: Wei Siang
- CTO / Architect: ChatGPT
- Backend Engineer: Codex
- Full-stack Engineer: Claude Code

## Sprint Duration

2–3 days.

## Deliverables

### 1. Repository Foundation

Create or confirm these folders:

```text
docs/
specs/
tasks/
prompts/
agents/
schemas/
apps/
packages/
infra/
research/
adr/
tests/
.github/
```

### 2. Application Scaffold

Recommended stack for MVP:

- Web: Next.js + TypeScript + Tailwind
- API: NestJS or FastAPI
- Database: PostgreSQL
- ORM: Prisma if TypeScript stack is selected
- Cache: Redis later, not required for Sprint 000
- Search: postpone to Sprint 003+
- AI provider: abstraction layer only, no direct hardcoding

### 3. Required Files

- README.md
- .gitignore
- .env.example
- CONTRIBUTING.md
- docs/00-foundation/atlas-master-architecture.md
- docs/00-foundation/development-standard.md
- tasks/sprint-000-foundation.md

### 4. CI/CD

Create basic GitHub Actions:

- install dependencies
- lint
- typecheck
- test

Do not deploy yet.

### 5. Acceptance Criteria

Sprint 000 is done when:

- Repository structure exists.
- Development standards are documented.
- App scaffold can start locally.
- CI runs on PR.
- No secrets are committed.
- Codex and Claude Code can understand where to work.

## Work Allocation

### Codex

Focus:

- Monorepo setup
- Backend/API scaffold
- Prisma/database skeleton
- CI workflow
- Test framework

### Claude Code

Focus:

- Next.js web scaffold
- Tailwind setup
- Base layout
- UI component structure
- Documentation cleanup

### ChatGPT

Focus:

- Architecture
- Product direction
- Database design review
- Scoring methodology
- PR review
- Sprint planning

## Do Not Build Yet

Do not build these in Sprint 000:

- Full dashboard
- Company scoring engine
- AI agent runtime
- Data ingestion
- Payment system
- Authentication beyond placeholder
- Production deployment
