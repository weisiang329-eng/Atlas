# Contributing to Atlas

## Workflow

1. Create a branch using `feature/<module>-<short-name>`, `fix/<module>-<short-name>`, or `docs/<topic>`.
2. Keep changes small and aligned with the active sprint scope.
3. Run lint, typecheck, and tests before opening a pull request.
4. Include scope, testing, risks, and migration notes in every pull request.

## Local validation

```bash
npm install
npm run lint
npm run typecheck
npm test
```

## Sprint 000 guardrail

Do not add production product features until the foundation sprint is accepted.
