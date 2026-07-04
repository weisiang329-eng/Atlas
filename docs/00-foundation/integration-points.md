# Atlas Frontend Integration Points v0.1

How the UI will connect to backend contracts **without coupling to them now**.
These seams exist and are typed; nothing in the app calls them yet. When Codex
publishes contracts, wiring is local and additive — no component redesign.

## The one data path

```
loader (server)                       component (server or client)
────────────────                      ────────────────────────────
apiFetch<T>(path)   ──►  Resource<T>  ──►  <DataState status={r.status}>
   (lib/api)             (lib/resource)         render r.data
```

A page never calls `fetch`, never holds a URL, and never branches on
loading/error itself. It asks a loader for a `Resource<T>` and hands the status
to `<DataState>`.

## Pieces (prepared, not wired)

- **`lib/api/client.ts`** — `apiFetch<T>(path, init)` reads
  `NEXT_PUBLIC_API_BASE_URL`, sets JSON headers, throws a typed `ApiError`
  (status + plain-language message). `isApiConfigured()` guards optional calls.
- **`lib/resource.ts`** — `Resource<T> = { status, data?, message? }` mapping 1:1
  onto `ResourceStatus`. Helpers: `ready`, `loading`, `empty`, `failed`,
  `fromList` (empty array → empty state).
- **`components/ui/data-state.tsx`** — renders the right state for a status.

## Migration recipe (per view, when a contract lands)

1. Write a loader that calls `apiFetch<T>` and returns `fromList(...)` / `ready(...)`.
2. Swap the mock import for the loader; keep the same `<DataState>` and render code.
3. Delete the corresponding `lib/mock/*` entry.

Today, loaders are effectively `ready(MOCK_*)`. The only change later is *where
the data comes from* — the layout, states and components are already final.

## Rules

- No component imports `fetch` or a URL directly.
- No UI depends on an unpublished endpoint's shape beyond a typed loader boundary.
- Errors reach the user as plain language (`ApiError.message`), never a status
  code or stack trace.
