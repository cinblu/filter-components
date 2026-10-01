# Filter Bar — Specification

Rules tagged `[T]` must be covered by a test.

## 1. Why this exists (from the article)
Filtering in data-heavy apps tends to fail in four ways. Each one maps to a feature here:

| Problem | Fix in this component |
|---|---|
| Users forget which filters are applied (they're hidden behind a "Filter (2)" button) | Every applied filter is a visible chip in the toolbar showing its value |
| Sorting becomes invisible once the table scrolls horizontally | Active sort is shown as a chip in the toolbar |
| All filters get equal weight, so key ones get lost in a long popover | Two tiers: 1–3 **Quick** filters always visible; the rest in a searchable **More Filters** menu |
| Filter controls compete with the data for screen space | Title, search and filters share **one toolbar row** |

Guiding principles: the data comes first, the UI stays quiet, and interactions are predictable.

## 2. Data model

```ts
type FilterType = "multiSelect" | "singleSelect" | "dateRange" | "text";

interface FilterOption { value: string; label: string; icon?: React.ReactNode }

interface FilterDefinition {
  id: string;                  // also the URL param key
  label: string;               // "Created Date"
  type: FilterType;
  tier: "quick" | "more";
  options?: FilterOption[] | (() => Promise<FilterOption[]>); // select types
  searchable?: boolean;        // default true when options.length > 7
  searchPlaceholder?: string;  // default: label, e.g. "Queues"
  presets?: DatePresetKey[];   // dateRange only
  allowCustomRange?: boolean;  // dateRange, default true
}

type DatePresetKey = "lastDay" | "last7d" | "last30d" | "lastMonth" | "thisMonth";

type DateRangeValue =
  | { kind: "preset"; preset: DatePresetKey }
  | { kind: "custom"; from: string; to: string }; // ISO dates, inclusive

type FilterValue = string[] | string | DateRangeValue;
type FilterState = Record<string, FilterValue | undefined>;

interface SortState { columnId: string; label: string; direction: "asc" | "desc" }
```

## 3. Headless hook — `useFilters`

```ts
const f = useFilters({
  definitions,
  applyMode: "manual" | "instant",   // default "manual"
  value?, defaultValue?, onChange?,  // controlled or uncontrolled
});
// f.applied, f.isActive(id), f.clear(id), f.clearAll(),
// f.openEditor(id) → { pending, setPending, apply, reset, canApply, discard }
// f.quickFilters, f.moreFilters, f.activeMoreFilters, f.activeCount
```

- `[T]` Applied state changes **only** through `apply`, `clear`, `clearAll`, or (in
  instant mode) `setPending`.
- `[T]` `canApply` is false when pending equals applied (compared by value, order-insensitive
  for arrays).
- `[T]` An empty array, empty string or undefined counts as "not set". Applying an empty
  value removes the filter.
- `[T]` `discard` throws away pending changes. Applied state stays as it was.
- `[T]` `onChange` fires once per applied change, never for pending edits.

## 4. Toolbar — `FilterBar`

Layout, left to right on one row:
`[title slot] [search] [quick chips…] [active more-tier chips…] [+ More Filters] [sort chip] [Clear all] ······ [actions slot]`

- Wraps onto a second line when there isn't enough width. It never scrolls horizontally.
- `[T]` Quick filters are always rendered: dashed when unset, filled when set.
- `[T]` More-tier filters render as chips **only while applied**. When cleared, they go
  back into the More Filters menu.
- `[T]` "Clear all" appears only when at least one filter is applied. It clears filters, not
  the search text and not the sort.
- The global search input is optional (`search` prop). It applies on typing with a 300 ms
  debounce. It does not use Apply.
- An optional `resultCount` prop renders "Showing 42 of 1,200" in an `aria-live="polite"`
  region.

## 5. Chip — `FilterChip`

- Unset: dashed 1px border, muted text, leading `+` icon, label only — `+ Created Date`.
- Set: solid subtle background, text `Label: summary`, trailing `×` button.
- Summary rules `[T]`:
  - multiSelect, 1 value → `Status: Open`
  - multiSelect, 2+ values → `Status: Open, +2`
  - singleSelect → the option label
  - dateRange preset → the preset label: `Created Date: Last 7 days`
  - dateRange custom → `Created Date: Apr 18 – Apr 24` (add the year only if the range
    isn't in the current year)
  - Truncate the summary at 24 characters with an ellipsis; the full value goes in
    `title` and the aria-label.
- `[T]` Clicking the chip body opens its editor in a popover anchored to the chip.
- `[T]` Clicking `×` clears that filter **immediately** (no Apply) and doesn't open the
  editor.
- The chip changes from dashed to filled with a 150 ms transition on border, background and
  width. No layout jump for neighbouring chips beyond the natural width change.

## 6. Editors

### 6.1 Multi-select
- Search input at top, autofocused, placeholder = `searchPlaceholder`.
- "Select all" row at top of the list:
  - `[T]` selects/deselects all **currently visible** (search-filtered) options
  - `[T]` shows the indeterminate state when some, but not all, visible options are selected
- **Selected-first ordering** `[T]`: when the editor **opens**, the options already
  selected are moved to the top (keeping their original relative order), followed by
  the rest. The order is **frozen while the editor is open**. Ticking or unticking items
  must not make rows jump under the cursor. The new order takes effect the next time it opens.
- `[T]` Empty search result shows "No matches".
- Footer (manual mode only): `Reset` (text button, clears the pending selection) on the
  left, `Apply` (primary) on the right. `[T]` Apply is disabled when `!canApply`.
- `[T]` Enter applies (when enabled). Escape discards and closes. Clicking outside
  discards and closes.
- Instant mode: no footer. Each toggle applies immediately.
- Must stay smooth with 500 options. Virtualise only if needed, and say so in the phase
  summary.

### 6.2 Date range
- Preset list (default: Last day, Last 7 days, Last 30 days, Last month) plus "Custom
  range…".
- `[T]` Clicking a preset applies it **immediately and closes**, even in manual mode. This
  is the "one click" behaviour from the article.
- `[T]` Presets are stored as keys and resolved to dates at query time (`resolvePreset(key,
  now)`), so "Last 7 days" stays relative in a shared URL.
- Preset definitions `[T]` (local time zone, inclusive):
  - `lastDay` = now − 24h → now
  - `last7d` = start of day 6 days ago → end of today
  - `last30d` = start of day 29 days ago → end of today
  - `lastMonth` = the whole previous calendar month
  - `thisMonth` = start of this month → end of today
- "Custom range…" shows a two-month range calendar (shadcn Calendar) with Reset and Apply.
  `[T]` Apply is disabled until both ends are picked.
- The currently applied preset/range is shown as selected when the editor opens.

### 6.3 Single-select and text
- Single-select: a list. Choosing an option applies and closes.
- Text: an input with Apply. Enter applies.

## 7. More Filters menu
- Trigger: a dashed chip `+ More Filters`.
- Opens a popover with a search input ("Filter") and a list of all more-tier filters.
  Applied ones show a small dot and their summary in muted text.
- `[T]` Typing filters the list by label (case-insensitive, substring).
- Each item has a `›` affordance. Hovering (desktop) or pressing → / Enter opens that filter's
  editor as a **nested panel to the right** (the "Queue Name ▸ → Queues" pattern). On narrow
  screens (< 640px) the editor replaces the list, with a back button.
- `[T]` Keyboard: ↑/↓ move, → or Enter opens the editor, ← or Escape inside the editor
  returns to the list, Escape on the list closes the menu.
- Applying inside a nested editor closes the whole menu and the new chip appears in the
  toolbar.

## 8. Sort chip
- Props: `sort?: SortState`, `onSortChange(sort | undefined)`.
- When a sort is set, render `↓ Created Date` (arrow shows direction).
- `[T]` Clicking the chip toggles the direction. `×` clears the sort.
- This keeps the active sort visible even when the column header is scrolled out of view.

## 9. Theming
Use shadcn tokens (`--background`, `--muted`, `--primary`, `--border`, `--ring`, …) plus
these component variables, defined with sensible defaults:

```css
--fb-chip-height: 1.75rem;
--fb-chip-radius: var(--radius-sm);
--fb-chip-gap: 0.375rem;
--fb-chip-border-style: dashed;     /* unset chips */
--fb-popover-width: 18rem;
--fb-density: 1;                    /* 0.875 compact, 1 default, 1.125 comfortable */
```

All sizes inside the component should derive from these variables so the customiser
(§12) can change them live.

## 10. Accessibility
- Chips are `<button>`s. Unset: `aria-label="Add Status filter"`. Set:
  `aria-label="Status filter: Open, Pending, Closed. Edit"`. The `×` button:
  `aria-label="Remove Status filter"`.
- `[T]` Focus returns to the triggering chip when an editor closes.
- All popovers are keyboard-operable and use the Radix/cmdk semantics that shadcn provides.
- Focus rings are visible. Colour contrast meets WCAG AA in light and dark themes.
- Motion: chip transitions 150 ms, popovers 120 ms. Nothing animates under
  `prefers-reduced-motion: reduce`.

## 11. Integrations
- **URL sync (`url-state.ts`)**: `useFilterUrlState(definitions)` returns
  `{ value, onChange }` to plug into `useFilters`. Format: `?status=open,closed&createdAt=last7d`
  or `createdAt=2026-04-18_2026-04-24`. `[T]` round-trips every value type. `[T]` unknown
  params are ignored.
- **TanStack adapter (separate registry item)**: `toColumnFilters(state, definitions)` and
  filter functions `multiSelectFn` and `dateRangeFn` (resolves presets at call time). Works for
  client-side filtering. For server-side, use `onChange` directly.

## 12. Docs site
- `/` — a short pitch (the four problems → fixes), a live demo, and the install command.
- `/demo` — a full-page table with ~2,000 synthetic rows, horizontal scroll, sorting, every
  filter type, both tiers, and a toggle between manual and instant apply.
- `/customise` — controls for density, chip radius, unset-chip style (dashed / ghost /
  outline), accent colour and light/dark, with a live preview. A "Copy CSS" button outputs the
  variable overrides.
- `/docs` — API reference for `FilterBar`, `useFilters` and the adapters, plus a section per
  craft detail with a short "why".

### Demo dataset (synthetic, seeded)
"Document processing queue". Columns: Batch ID, Queue (e.g. Intake, Billing, Legal Review,
Claims, Archive — 12 total), Workflow, Status (Initial, In Review, Committed, Failed),
Assignee (invented first names only), Pages, Created Date (last 18 months), Source
(Upload, Email, Fax, API).
Quick filters: Created Date, Queue, Status. More: Workflow, Assignee, Source, Batch ID (text).

## 13. Registry
- Item `filter-bar` (type `registry:block`): everything in `registry/filter-bar/`.
  `registryDependencies`: the shadcn primitives used. `dependencies`: date-fns, lucide-react.
- Item `filter-bar-tanstack`: the adapter, with `@tanstack/react-table` as a dependency and
  `filter-bar` as a registry dependency.
- Acceptance: in a **fresh** Next.js + shadcn app, `npx shadcn add <local-url>/r/filter-bar.json`
  installs cleanly, typechecks, and a minimal example renders.

## Decisions log
Defaults chosen where the article didn't say. Nahid can override any of them.
1. Clicking outside an editor **discards** pending changes (same as Escape). Rationale:
   predictable, and avoids accidental expensive queries.
2. Removing a filter with `×` applies immediately, without Apply.
3. Date presets apply in one click, even in manual mode.
4. "Last month" means the previous calendar month. A rolling window is `last30d`.
5. "Clear all" leaves search and sort alone.
6. Selected-first reordering happens only when the editor opens, never live.
<!-- Claude Code: append new decisions below with a number and one-line rationale. -->
7. Demo Created Dates are seeded offsets back from the start of today, not fixed calendar
   dates. Rationale: date presets like "Last 7 days" always have matches whenever the demo is
   opened, while every other field stays identical across runs.
8. Registry files install under `components/filter-bar/` (explicit `target`s), keeping the
   `editors/` sub-folder. Rationale: one folder people can find and edit, and relative imports
   between the files keep working.
9. Pending edits are kept per filter id, and `openEditor(id)` has no side effects (safe to call
   in render). Editors call `discard()` when they close without applying. Rationale: no stale
   handles, and the hook holds no UI state.
10. Active more-tier chips appear in the order they were applied; re-applying a filter keeps its
    position. Rationale: a new chip appears at the end and existing chips never jump.
11. `onChange` does not fire when a call changes nothing (e.g. applying an unchanged selection,
    clearing an unset filter). Rationale: avoids pointless refetches.
12. Values for ids with no definition are dropped from applied state. Rationale: stale URLs or
    saved views can't create invisible filters.
