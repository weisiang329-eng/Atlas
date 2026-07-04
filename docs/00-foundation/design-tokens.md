# Atlas Design Tokens v0.1

One source of truth for the visual system. Colour is defined once as CSS
variables in `apps/web/app/globals.css` and exposed to Tailwind in
`tailwind.config.ts`. Spacing, radii, and type come from Tailwind's scale.
Components reference tokens only — never raw hex — so theming (dark ⇄ light) and
future rebrands are a token edit, not a component sweep.

## Colour tokens

| Token          | Tailwind        | Role                                    |
| -------------- | --------------- | --------------------------------------- |
| `--bg`         | `bg-bg`         | App background                          |
| `--surface`    | `bg-surface`    | Panels, cards, bars                     |
| `--surface-2`  | `bg-surface-2`  | Raised / hover / inset                  |
| `--border`     | `border-border` | Hairlines, dividers                     |
| `--fg`         | `text-fg`       | Primary text                            |
| `--muted`      | `text-muted`    | Secondary text                          |
| `--faint`      | `text-faint`    | Tertiary / labels                       |
| `--accent`     | `*-accent`      | Brand accent — **one** per view         |
| `--accent-dim` | `*-accent-dim`  | Accent border / muted accent            |

### Semantic (state) tokens

Separate from the accent — these encode meaning, not brand. Do not use them as
decoration.

| Token        | Tailwind      | Meaning                    |
| ------------ | ------------- | -------------------------- |
| `--positive` | `*-positive`  | Good / up / gain           |
| `--negative` | `*-negative`  | Bad / down / loss / error  |
| `--warning`  | `*-warning`   | Caution / needs attention  |
| `--info`     | `*-info`      | Neutral information        |

Surfaced through `<Badge tone="…">` (`neutral | accent | positive | negative |
warning | info`) and directly in tables/charts (e.g. negative figures).

## Theme

Dark is primary. The `.light` class on `<html>` overrides every colour token, so
the whole app is dark-mode ready with no hardcoded palette. `color-scheme` is set
per theme for native form controls.

## Type

- Sans: **IBM Plex Sans** (`font-sans`) — UI and body.
- Mono: **IBM Plex Mono** (`font-mono`) — figures, tickers, labels, code.
- Serif: **IBM Plex Serif** (`font-serif`) — display headings.
- `--font-*` variables are wired by `next/font` in `app/layout.tsx`.
- Numeric columns use `tabular-nums`; small labels use the `.eyebrow` utility
  (mono, uppercase, tracked) and the `text-2xs` step.

## Spacing, radius, elevation

- Spacing: Tailwind's 4px scale; layout uses `gap` on flex/grid, not per-element
  margins.
- Radius: `rounded` for controls, `rounded-panel` (0.5rem) for surfaces.
- Elevation: `shadow-panel` — the single card elevation. Avoid ad-hoc shadows.

## Density

A root **`data-density`** attribute on `<html>` switches the vertical rhythm of
dense surfaces globally. Dense components reference `var(--cell-py)` (table cell
padding) rather than a fixed `py-*`.

- `comfortable` (default): `--cell-py: 0.625rem`.
- `compact`: `--cell-py: 0.3125rem`.

Set from **Settings → Appearance** (persisted to `localStorage`; restored before
paint by an inline script in the root layout). To make a new dense surface
density-aware, use `py-[var(--cell-py)]` on its cells. Theme (`.light`) and
density are the two user-controlled appearance axes.

## Rules

- Reference tokens, never raw colour values, in components.
- The accent is spent in one place per view; everything else stays quiet.
- Semantic colour ≠ accent. A gain is `positive`, not "the brand colour".
