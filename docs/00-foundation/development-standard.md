# Atlas Development Standard v0.1

## 1. Core Rule

Atlas is a long-term platform. Build for maintainability, auditability and extensibility.

## 2. Branching

- `main`: stable branch only.
- `dev`: integration branch.
- `feature/<module>-<short-name>`: feature work.
- `fix/<module>-<short-name>`: bug fixes.
- `docs/<topic>`: documentation work.

All non-trivial changes must go through PR review.

## 3. Commit Style

Use conventional commits:

```text
feat: add company profile schema
fix: correct scoring formula
chore: configure linting
docs: add research methodology
refactor: separate valuation module
test: add scoring engine tests
```

## 4. Code Standards

- TypeScript first.
- Strict typing required.
- No business logic inside UI components.
- No hardcoded scoring logic inside the frontend.
- Prefer small services and explicit interfaces.
- Every module must include README or usage notes.

## 5. Testing Standards

Required test layers:

- Unit tests for scoring, valuation, parsing and data transformation.
- Integration tests for API and database workflows.
- Contract tests for API schemas.
- Regression tests for scoring changes.

## 6. Data Standards

Every important data point must store:

- source
- source_url where available
- source_date
- ingestion_date
- confidence
- created_by
- updated_by

## 7. AI Output Standards

AI-generated research must label:

- Facts
- Assumptions
- Inferences
- Risks
- Open questions
- Source references

## 8. Security Standards

- Never commit secrets.
- Use `.env.example` only.
- All API keys must be environment variables.
- Role-based access control is required before production use.

## 9. Review Standard

A PR is not ready unless it includes:

- Summary
- Scope
- Testing performed
- Screenshots if UI changes
- Migration notes if database changes
- Known risks
