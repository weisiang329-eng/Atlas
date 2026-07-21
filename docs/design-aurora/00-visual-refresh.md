# Atlas Visual Refresh v0.2 (ATLAS-UI-P00X)

> **Goal** — lift Atlas from "clean dark dashboard" to **premium institutional
> terminal**: Bloomberg density × Linear/Arc refinement × Moomoo market
> expressiveness. This is a **token-value + component-visual upgrade**, NOT a
> rebuild. The token architecture, component contracts, and data path
> (`loader → apiFetch → Resource → DataState`) are unchanged. Components still
> reference tokens only — never raw hex.

- **Status:** ✅ **Direction chosen — 1b Aurora Glass.** Token layer shipped as
  drop-in files (`atlas-handoff/apps/web/app/globals.css` +
  `tailwind.config.ts`). Component-visual upgrades follow in batches. Preview:
  `Atlas Visual Directions.dc.html` (id 1b).
- **Scope in:** color layering, radius/shadow, chart visual language, number &
  state motion, empty/loading skeletons, light-theme sync, numeric glyph rule.
- **Scope out:** new routes, data model, copy. Those live in the module docs.

---

## 0. Non-negotiables

1. **Don't break tokens.** Every value below maps to an existing `--*` variable
   (or a small, additive set). No component learns a new hex.
2. **Dark is primary, light is an override.** Every new token ships a `.light`
   value in the same commit.
3. **One accent per view.** `--accent` (amber) is spent once per screen on the
   single most important thing. Everything else is neutral or semantic.
4. **Semantic ≠ decoration.** `--positive/--negative/--warning/--info` encode
   meaning only. A gain is `positive`, never "the brand colour".
5. **Reduced motion respected.** All flashes/shimmers gate on
   `@media (prefers-reduced-motion: reduce)` → instant, no animation.

---

## 1. Layering system — four background depths

Today we have 3 background layers. Add a **4th** for inset wells (chart plots,
table zebra troughs, code/quote blocks) so depth reads without borders.

| Token          | Dark      | Light     | Role                                            |
| -------------- | --------- | --------- | ----------------------------------------------- |
| `--bg`         | `#080b11` | `#f6f7f9` | App canvas (behind everything)                  |
| `--surface`    | `#0e131c` | `#ffffff` | Cards, panels, bars — the default raised plane  |
| `--surface-2`  | `#131a26` | `#eef1f5` | Hover, selected row, embedded/nested card       |
| `--surface-3`  | `#171f2e` | `#e5e9f0` | **NEW** — inset wells: chart plot area, input, quote block |

Rules:
- Depth is expressed by **layer + hairline**, not by shadow stacking.
- A card on `--bg` is `--surface`; a card *inside* a card steps to `--surface-2`;
  a plotted/inset region steps to `--surface-3`. Never skip more than one step.

### Border tiers

| Token           | Dark      | Role                                       |
| --------------- | --------- | ------------------------------------------ |
| `--border`      | `#202a3a` | Standard hairline (dividers, card edge)    |
| `--border-soft` | `#182231` | **NEW** — quiet inner dividers (table rows)|
| `--border-strong` | `#2c3a50` | **NEW** — emphasis edge (active tab, focus)|

---

## 2. Radius & shadow upgrade

Single card system stays; values get more refined.

| Token             | Old      | New       | Use                                  |
| ----------------- | -------- | --------- | ------------------------------------ |
| `--radius`        | 0.375rem | `0.5rem`  | Controls (buttons, inputs, chips)    |
| `--radius-panel`  | 0.5rem   | `0.75rem` | Surfaces (cards, panels, drawers)    |
| `--radius-pill`   | —        | `999px`   | Chips, badges, toggles               |

Shadows — one soft ambient elevation, not ad-hoc drops:

```
--shadow-panel: 0 1px 0 0 rgba(255,255,255,.02) inset,   /* top sheen  */
                0 1px 2px rgba(0,0,0,.4),
                0 8px 24px -12px rgba(0,0,0,.55);
--shadow-pop:   0 12px 40px -12px rgba(0,0,0,.7);         /* menus/drawer */
--glow-accent:  0 0 0 1px rgba(242,177,61,.25),
                0 0 18px -4px rgba(242,177,61,.45);        /* accent focus/live */
```

Light theme: drop the inset sheen, soften alphas to `~.12`.

---

## 3. Chart visual language

All charts stay **pure SVG** (no libs). One shared visual grammar:

- **Grid:** horizontal hairlines only, `rgba(255,255,255,.045)` dark /
  `rgba(0,0,0,.05)` light. No vertical grid, no axis boxes.
- **Line series:** 2px stroke, round join/cap. Primary series uses `--accent`;
  comparison/benchmark is `--faint` **dashed** (`4 4`).
- **Gradient fill:** area under the primary line fades accent → transparent
  (`stop 0% = accent @ .22`, `100% = accent @ 0`). Positive-context areas may use
  `--positive`; negative `--negative`.
- **Glow accent line (direction-dependent):** primary stroke may carry
  `filter: drop-shadow(0 0 6px accent@.5)` for the "live" terminal feel. Off in
  the dense/Terminal direction, on in Aurora/Live.
- **Positive / negative:** any up value is `--positive`, down is `--negative` —
  in candles, bars, deltas, and flashes alike. Never swap for brand amber.
- **Sparkline:** 1.5px stroke, no fill, colour = series direction (pos/neg),
  22–28px tall, `preserveAspectRatio: none`.
- **Candlestick (new component `Candlestick`):** body = open→close rect, wick =
  high→low line; up = `--positive`, down = `--negative`; body min-height 1px;
  0.5px rounding; volume histogram optional under plot.
- **Heatmap:** diverging scale anchored at 0 — `--negative` (neg) → neutral →
  `--positive` (pos); alpha encodes magnitude (`.15 + |t|·.75`, `t = v/scale`).
- **Time-of-day (分时) chart:** area+line vs previous-close baseline; above
  baseline positive-tinted, below negative-tinted; baseline is a `--faint`
  dashed rule.

---

## 4. Number & state motion

- **Numeric glyph rule (boss requirement):** figures must use a **plain zero —
  no dot, no slash.** IBM Plex Mono ships a dotted zero, so numeric/figure
  columns use **IBM Plex Sans with `tabular-nums`** (plain oval zero, still
  column-aligned). IBM Plex Mono stays only for tickers / eyebrow labels / code,
  where zeros are rare; if a mono zero ever shows a dot, swap that instance to
  Plex Sans tabular-nums. Serif (display) and Sans both have clean zeros.
- **Price flash:** on quote change, the cell (or row) background pulses for
  ~600ms then fades — up = `--positive @ .22`, down = `--negative @ .22`
  (Live direction: `.40`). Digits may briefly tint the semantic colour, then
  return to `--fg`. Implementation: transient class toggled on new tick, CSS
  `transition: background-color .6s ease`. Never animate layout.
- **Delta chips:** `+1.82%` / `-0.63%` in semantic colour with a ▲/▼ glyph;
  tabular-nums so widths don't jump.
- **Count-up (optional, v2):** large KPI values ease from previous to new over
  ~400ms; disabled under reduced-motion.
- **Reduced motion:** all of the above become instant state changes.

---

## 5. Empty & loading states (DataState four-state)

`<DataState>` stays the single source; refresh its visuals.

- **Loading → skeleton:** shimmering placeholder blocks matching the final
  layout (KPI bars, table rows, chart box). Shimmer = a `--surface-2 → --surface-3`
  gradient sweeping L→R over 1.4s; `border-radius` matches the real element.
  Reduced-motion → static `--surface-2` blocks, no sweep.
- **Empty:** centred quiet state — small line icon (`--faint`), one-line reason,
  optional single action. No illustration clutter.
- **Error:** `--negative` hairline card, short cause, "Retry" button. Never a
  raw stack trace in the UI.
- **Ready:** the real content.

Skeleton tokens:
```
--skeleton-base:  var(--surface-2);
--skeleton-sheen: var(--surface-3);
```

---

## 6. Light theme sync

Every token above ships a `.light` value the same commit. Principles:

- Canvas `--bg` is a cool near-white `#f6f7f9`; cards pure `#ffffff`; steps go
  *darker* for depth (inverse of dark mode).
- Accent amber holds hue but drops ~8% lightness for AA contrast on white.
- Semantic colours darken slightly (`--positive #2f9d59`, `--negative #d83b41`).
- Shadows lose the inset sheen and soften to `rgba(0,0,0,.10–.14)`.
- Charts: grid → `rgba(0,0,0,.05)`; gradient fills lower alpha (`.14`).
- `color-scheme: light` set so native controls follow.

---

## 7. The three directions (pick one)

All three keep IBM Plex + amber accent + dark-primary and the token names above.
They differ in **token *values*, radius/shadow weight, chart treatment, density,
and motion intensity.** See `Atlas Visual Directions.dc.html` (ids 1a / 1b / 1c).

### 1a — Terminal Prime  *(max Bloomberg)*
Densest, most serious. Radius small (controls `0.375rem`, panels `0.5rem`),
hairlines crisp, **no glow**, subtle gradient fills, compact density default,
mono-forward. Flash = quiet `.18` bg tint. For heads-down monitoring; every
pixel is data.

### 1b — Aurora Glass  *(Linear / Arc refinement)*  ← recommended default
Refined & modern. Radius generous (`0.75rem` panels), soft `--shadow-panel`,
faint translucency on floating surfaces, **glow accent line on primary charts**,
comfortable density, larger section rhythm. Flash = smooth `.22` fade. Reads
premium and calm while staying dense.

### 1c — Live Tape  *(Moomoo expressiveness)*
Most alive. Vivid `--positive/--negative`, a scrolling ticker tape strip,
prominent candlesticks + 分时, strong price flash (`.40` pulse + digit tint),
up/down arrows in quote tape, radius `0.5rem`. For active market watching; more
colour energy, brand amber still single-accent.

| Axis            | 1a Terminal | 1b Aurora | 1c Live Tape |
| --------------- | ----------- | --------- | ------------ |
| Panel radius    | 0.5rem      | 0.75rem   | 0.5rem       |
| Shadow          | minimal     | soft      | medium       |
| Chart glow      | off         | on        | on (strong)  |
| Density default | compact     | comfortable | comfortable |
| Flash strength  | .18         | .22       | .40          |
| Colour energy   | low         | medium    | high         |

---

## 8. Rollout order (after pick)

1. Land the token values (dark + light) in `globals.css` + `tailwind.config.ts`
   — additive tokens: `--surface-3`, `--border-soft/-strong`, `--radius-pill`,
   `--shadow-*`, `--glow-accent`, `--skeleton-*`.
2. Upgrade primitives: card/panel (radius+shadow), Badge/Chip (pill), DataState
   (skeleton shimmer + states).
3. Upgrade chart set: shared gradient/glow/grid grammar; add `Candlestick` +
   分时 chart; sparkline colour rule.
4. Add price-flash to DataTable numeric cells + KpiCard (feeds P027 quotes).
5. Light-theme pass + reduced-motion audit.
6. Visual QA against the picked mockup; density both modes; a11y contrast.

**Acceptance:** picked direction reproduced across Home / Company / Markets;
no raw hex in components; light + dark + compact/comfortable all clean;
reduced-motion kills all animation; zeros render plain everywhere.
