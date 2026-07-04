# Atlas Layout System v0.1

The structural spine every Atlas module hangs off. One shell, one workspace
layout, one dashboard grid — a new module is composition, not new scaffolding.

## Primitives (`components/layout`, `components/dashboard`)

- **`AppShell`** — the outermost frame: sidebar (`Sidebar` ≥`lg` + `MobileNav`
  drawer below) + top bar (`Topbar`, with `CommandSearch`) + a scrollable,
  width-capped workspace. Owns the container width so every route aligns.
- **`WorkspaceLayout`** — shell + header + tab navigation + content, in one
  component. Default header is a `PageHeader` (`eyebrow`/`heading`/`description`/
  `actions`); pass a **`header`** slot to override with a custom masthead (the
  company detail does this). `tabs` renders a `TabNav`.
- **`TabNav`** — route-based sub-navigation (workspaces). For in-page tabbed
  content use `Tabs` instead.
- **`DashboardGrid` + `Widget`** — responsive 12-column grid (2-up tablet,
  stacked mobile); `Widget` sets the large-screen `span`.
- **`SplitPaneLayout`** — two-pane, side-by-side from `lg`, stacked below;
  `leftWidth` = `sm`/`md`/`lg`/`half`. The base for document viewers, comparison
  and master–detail. `DocumentViewer` is built on it.
- **`DetailPanelLayout`** — master (list) + detail on `SplitPaneLayout`; shows an
  empty state when nothing is selected. Parent owns selection. In use on the
  Companies index (`CompaniesBrowser`: FilterBar + list + live preview).

## The workspace pattern

```tsx
// A new workspace layout is just:
<WorkspaceLayout title="X" eyebrow="…" description="…" tabs={X_TABS}>
  {children}
</WorkspaceLayout>
```

Financials, Research and Knowledge use the default header; the company detail
passes a custom `header`. Adding a module means adding its `SubTab[]` to `nav.ts`
and a thin layout — no copied shell/header/tab scaffolding.

## Responsive & density

- Breakpoints follow Tailwind (`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280).
  The sidebar appears at `lg`; below it, `MobileNav` provides the drawer.
- Content max-width and section rhythm live in `AppShell`/`WorkspaceLayout`, so
  spacing stays consistent across modules.

## Future extension

- Optional per-workspace right rail (`WorkspaceLayout` already centralises the
  header/tabs seam where it would attach).
- A resizable divider for `SplitPaneLayout` (drag to re-proportion).
- Three-pane (nav + list + detail) for large screens.
