# Atlas Component Catalog — Interaction v0.1

Per-component reference for the interaction primitives (Program 002, Phase 4).
Format: Purpose · Props · Usage · Do · Don't · Accessibility · Future. See the
living gallery at `/style-guide`.

## Toast / `ToastProvider`, `useToast`

- **Purpose** — transient, app-wide notifications.
- **Props** — `notify({ title, description?, tone })`, `tone: info|positive|warning|negative`.
- **Usage** — mount `<ToastProvider>` once (root layout); call `useToast().notify(...)`.
- **Do** — keep messages short and plain-language; use tone semantically.
- **Don't** — use for errors that need a decision (use Dialog); never stack dozens.
- **A11y** — `role="status"` (`alert` for negative); auto-dismiss ~4s; dismissible.
- **Future** — action buttons, positioning options, promise-based helpers.

## `Tabs`

- **Purpose** — in-page tabbed content (not routing — see `TabNav`).
- **Props** — `tabs: {id,label,content}[]`, `defaultId?`.
- **Usage** — `<Tabs tabs={[...]} />`.
- **Do** — use for co-equal views of one context.
- **Don't** — use for navigation between routes (use `TabNav`).
- **A11y** — `tablist/tab/tabpanel`, ←→/Home/End, roving tabindex.
- **Future** — controlled mode, lazy panels, vertical orientation.

## `Dropdown`

- **Purpose** — action/selection menu from a trigger.
- **Props** — `label`, `items: {label,onSelect,disabled?}[]`, `align?`.
- **Usage** — `<Dropdown label="Actions" items={[...]} />`.
- **Do** — group related actions; disable rather than hide when contextual.
- **Don't** — put primary page actions only here.
- **A11y** — `aria-haspopup/expanded`, `menu/menuitem`, ↑↓, Esc, outside-click.
- **Future** — sections/dividers, checkable items, submenus.

## `FormField`, `ValidationMessage`, `TextInput`, `Select`

- **Purpose** — labelled, validated form controls.
- **Props** — `FormField{label,htmlFor,hint?,error?,required?}`; inputs are native props.
- **Usage** — `<FormField label htmlFor="x" error><TextInput id="x" aria-invalid/></FormField>`.
- **Do** — always pair `htmlFor` with the control `id`; set `aria-invalid` on error.
- **Don't** — put business/validation logic in the field; the parent owns it.
- **A11y** — label association; error `role="alert"`.
- **Future** — `Textarea`, `Checkbox`/`Radio`, field groups, async validation display.

## `StatusBadge`, `ConfidenceBadge`

- **Purpose** — one consistent mapping of status / confidence → colour.
- **Props** — `StatusBadge{status}`, `ConfidenceBadge{level, showWord?}`.
- **Do** — use instead of hand-mapping tones per page.
- **Don't** — invent per-page status colours.
- **A11y** — colour + text; `ConfidenceBadge` carries an `aria-label`.
- **Future** — extend the status map as modules add lifecycle states.
