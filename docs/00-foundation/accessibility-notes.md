# Atlas Accessibility Notes v0.1

Accessibility is a platform requirement, implemented once in shared primitives so
every module inherits it. This is the standard Atlas components must meet.

## Standard

- **Semantics first** — real elements (`<button>`, `<table>`, `<nav>`, `<dialog>`
  semantics) over `div` soup. Tables use `<th scope>` and a `<caption>`.
- **Keyboard** — everything operable is reachable and operable by keyboard.
  Visible focus is never removed; `focus-visible:outline-accent` is the ring.
- **Overlays** (`useOverlay`) — focus moves in on open, is trapped, Escape closes,
  focus returns to the trigger on close, body scroll locks. Used by Dialog,
  Drawer and CommandSearch.
- **Live regions** — Toasts use `role="status"` (`alert` for errors); loading uses
  `role="status" aria-busy`; errors use `role="alert"`.
- **State in more than colour** — status/severity carry a label or icon, not just
  hue (StatusBadge, ConfidenceBadge, RiskMatrix).
- **Motion** — transitions are gated with `motion-reduce:*`; nothing essential
  depends on animation.
- **Images/graphics** — charts and graphs set `role="img"` + `aria-label`.

## Component patterns

| Pattern | Roles / keys |
| --- | --- |
| `Dialog` / `Drawer` | `role="dialog"`, `aria-modal`, Esc, focus trap/restore |
| `CommandSearch` | `role="listbox"`/`option`, ⌘K, ↑↓ + Enter |
| `Tabs` | `role="tablist"/"tab"/"tabpanel"`, ←→ Home End, roving tabindex |
| `Dropdown` | `aria-haspopup`, `aria-expanded`, `role="menu"/"menuitem"`, ↑↓, Esc, outside-click |
| `FormField` | `<label htmlFor>` ↔ control `id`; `aria-invalid`; error `role="alert"` |

## Not yet covered (future extension)

- Automated a11y testing in CI (axe) — see Future Extension Notes.
- Full screen-reader passes on complex viz (graphs export a label today; a data
  table fallback is the next step).
- Reduced-transparency handling for `backdrop-blur` surfaces.
