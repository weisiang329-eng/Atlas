# Atlas API

Minimal Sprint 000 backend scaffold for Atlas.

## Commands

```bash
npm run dev --workspace @atlas/api
npm run lint --workspace @atlas/api
npm run typecheck --workspace @atlas/api
npm test --workspace @atlas/api
```

## Endpoints

- `GET /health` returns service status for local and CI smoke checks.

The API uses Node.js native TypeScript stripping in Sprint 000 so the scaffold can run without adding third-party runtime dependencies.
