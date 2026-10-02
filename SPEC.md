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

Layout, two areas on one row:
`[title slot] [search] [quick chips…] [active more-tier chips…] [+ More Filters] [sort chip]` ······ `[Clear all] [result count] [actions slot]`

- The filters area wraps within itself when there isn't enough width. The right-hand group
  (Clear all, count, actions) stays put; on narrow screens it drops below. Nothing scrolls
  horizontally.
- `[T]` Quick filters are always rendered: dashed when unset, filled when set.
- `[T]` More-tier filters render as chips **only while applied**. When cleared, they go
  back into the More Filters menu.
- `[T]` "Clear all" appears only when at least one filter is applied. It clears filters, not
  the search text and not the sort. When a result count or actions sit beside it, it keeps
  its space while hidden, so it always appears in the same spot and they never shift. With
  nothing beside it, it simply appears.
- The global search input is optional (`search` prop). It applies on typing with a 300 ms
  debounce. It does not use Apply.
- An optional `resultCount` prop renders "Showing 42 of 1,200" in an `aria-live="polite"`
  region.

## 5. Chip — `FilterChip`

- Unset: dashed 1px border, muted text, leading `+` icon, label only — `+ Created Date`.
  Min width 60px. Optional context tooltip on hover from `definition.description`.
- Set: solid 1px border, `× Label  Value ▾`. The leading `+` turns 45° into the `×`, which
  removes the filter; there is no other ×. The value and chevron are in the primary colour;
  the chevron points up while the editor is open. Max width 400px; the value is cut off with
  an ellipsis after one line.
- Summary rules `[T]`:
  - multiSelect, 1 value → `Status  Open`
  - multiSelect, 2+ values → `Status  3 items`
  - singleSelect → the option label
  - dateRange preset → the preset label: `Created Date  1 week ago`
  - dateRange custom → `Created Date  Apr 18 – Apr 24` (add the year only if the range
    isn't in the current year)
- Hover tooltip on a set chip: the full value — every selected label, or for a date preset
  the exact span it covers now (`2026-04-18 12:00 AM – 2026-04-24 11:59 PM`). Never shown
  while the editor is open. The aria-label carries the full value too.
- The popover opens 8px below the chip.
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
- A thin line separates the options that were selected when the editor opened from the
  rest (frozen with the order).
- The search input shows a primary-coloured border while focused.
- Footer (manual mode only): `Reset` (primary-coloured text button, clears the pending
  selection) on the left, `Apply` (primary) on the right. `[T]` Apply is disabled when
  `!canApply`.
- `[T]` Enter applies (when enabled). Escape discards and closes. Clicking outside
  discards and closes.
- Instant mode: no footer. Each toggle applies immediately.
- Must stay smooth with 500 options. Virtualise only if needed, and say so in the phase
  summary.

### 6.2 Date range
- Preset list (default: 1 day ago, 3 days ago, 1 week ago, 1 month ago, 3 months ago,
  6 months ago, 1 year ago) plus "Custom date…". "N ago" means "since N ago, up to now".
- `[T]` Clicking a preset applies it **immediately and closes**, even in manual mode. This
  is the "one click" behaviour from the article.
- `[T]` Presets are stored as keys and resolved to dates at query time (`resolvePreset(key,
  now)`), so "Last 7 days" stays relative in a shared URL.
- Preset definitions `[T]` (local time zone, inclusive):
  - `lastDay` ("1 day ago") = now − 24h → now
  - `last3d` ("3 days ago") = start of day 2 days ago → end of today
  - `last7d` ("1 week ago") = start of day 6 days ago → end of today
  - `last1m` / `last3m` / `last6m` ("N months ago") = start of the same date N months ago →
    end of today
  - `last1y` ("1 year ago") = start of the same date a year ago → end of today
  - Also available, not in the default list: `last30d` ("Last 30 days") = start of day 29
    days ago → end of today; `lastMonth` = the whole previous calendar month; `thisMonth` =
    start of this month → end of today
- "Custom date…" opens a "Filter by {label}" dialog with a two-month range calendar
  (shadcn Calendar) and Apply. `[T]` Apply is disabled until both ends are picked. Escape or
  ✕ closes only the dialog and returns to the presets.
- The currently applied preset/range is shown as selected when the editor opens.

### 6.3 Single-select and text
- Single-select: a list. Choosing an option applies and closes.
- Text: an input with Apply. Enter applies. From the More Filters menu it opens in a
  "Filter by {label}" dialog instead of a side card.

## 7. More Filters menu
- Trigger: a dashed chip `+ More Filters`.
- Opens a popover with a search input ("Filter") and a list of all more-tier filters.
  Applied ones show a small dot and their summary in muted text.
- `[T]` Typing filters the list by label (case-insensitive, substring).
- Select and date items have a `›` affordance. Hovering (desktop) or pressing → / Enter opens
  that filter's editor as a **second card 8px to the right** (the "Queue Name ▸ → Queues"
  pattern). On narrow screens (< 640px) the editor replaces the list, with a back button.
- Text items (no `›`) open a "Filter by {label}" dialog on → / Enter / click. Escape or ✕
  returns to the list.
- `[T]` Keyboard: ↑/↓ move, → or Enter opens the editor, ← or Escape inside the editor
  returns to the list, Escape on the list closes the menu.
- Applying inside a nested editor closes the whole menu and the new chip appears in the
  toolbar.

## 8. Sort chip
- Props: `sort?: SortState`, `onSortChange(sort | undefined)`.
- When a sort is set, render `× Sort: Created Date  Newest first ▾`, styled like a set filter
  chip. "Sort:" is a fixed label. The direction words come from
  `sort.directionLabels` (default "Ascending" / "Descending").
- `[T]` Clicking the chip opens a menu with the two directions; choosing one changes it.
  `×` clears the sort.
- This keeps the active sort visible even when the column header is scrolled out of view.

## 9. Theming
Use shadcn tokens (`--background`, `--muted`, `--primary`, `--border`, `--ring`, …) plus
these component variables, defined with sensible defaults:

```css
--fb-chip-height: 1.75rem;
--fb-chip-radius: var(--radius-sm);
--fb-chip-gap: 0.375rem;
--fb-chip-border-style: dashed;     /* unset chips */
--fb-chip-min-width: 3.75rem;       /* 60px */
--fb-chip-max-width: 25rem;         /* 400px; the value truncates after one line */
--fb-chip-font-size: 0.8125rem;
--fb-popover-width: 18rem;
--fb-density: 1;                    /* 0.875 compact, 1 default, 1.125 comfortable */

/* Derived; components use these */
--fb-chip-h: calc(var(--fb-chip-height) * var(--fb-density));
--fb-chip-px: calc(0.5rem * var(--fb-density));
--fb-row-py: calc(0.375rem * var(--fb-density));
```

The registry item installs this block. The docs site uses a green `--primary`, which is
what the chip values, Apply buttons and focus borders pick up.

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
- `/` — a component page: title and subtext, a Preview/Code frame with the install command,
  then **The details** (one live interaction per card, with its "why"), **Make it yours**
  (a property bar over a live toolbar), Installation (npm/pnpm/bun/yarn), Usage and API. An
  "On this page" rail on the right follows the section being read.
- `/demo` — a full-page table with ~2,000 synthetic rows, horizontal scroll, sorting, every
  filter type and both tiers. The result count is a status line under the table.
- `/customise` — a canvas: the component in a window, a floating toolbar of properties, and
  a CSS panel with Copy CSS.
- `/docs` — the same page layout and rail.
- Top bar: brand, Demo / Customise / Docs, GitHub, theme (light by default). Demo options
  (apply mode, tooltips, accent) sit in an **Options** popover on the preview frame and on
  `/demo`: developer-level settings, kept outside the filter bar.
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
13. Multi-select keyboard: Enter applies (manual mode); Space toggles the highlighted row once
    the user has moved with ↑/↓, otherwise it types a space into the search. In instant mode
    Enter toggles. Rationale: keeps SPEC's "Enter applies" while still letting keyboard users
    tick rows, and searches with spaces ("Legal Review") still work.
14. The "+N" summary names the first selected value in option order, and truncation shortens
    that label rather than cutting off "+N". Rationale: stable chip text; the count is the
    more important part.
15. After removing a filter with ×, focus moves to the chip body (the × no longer exists).
    Rationale: keyboard users don't lose their place.
16. Async `options` are loaded when the editor first opens and cached per loader. Until then,
    chips show raw values. Rationale: no fetching for filters nobody opens.
17. The custom date range and the text editor keep Apply in instant mode too. Rationale: a
    range takes two clicks and text takes many keystrokes; applying half-finished input would
    run pointless queries.
18. Custom range: the first click sets the start, the second the end (either order), a third
    starts again. Clicking the same day twice gives a one-day range.
19. The More Filters editor is a second panel inside the same popover, not a nested popover.
    Rationale: one layer, so Escape, focus and outside clicks behave predictably.
20. Hovering a menu item opens its editor after 150 ms, only at ≥ 640px, without taking focus,
    and never replaces an editor that has focus or unapplied changes. Rationale: moving the
    mouse towards the panel shouldn't open everything it crosses or throw work away.
21. In the menu, → opens the editor only when the caret is at the end of the search text, and
    ← returns to the list only when the caret is at the start of a text field. Rationale: the
    arrow keys still move the caret while typing.
22. Opening another filter's editor from the menu discards the previous editor's unapplied
    changes. Choosing the already-selected single-select option just closes.
23. URL sync uses `history.replaceState`, so filter changes don't add Back-button entries. It
    uses the plain History API (works with any router; Next.js stays in sync). Params that
    aren't filters are kept; filter params follow them, in the order filters were applied.
24. In the URL, each list value is percent-encoded on its own, so commas inside values survive
    (`status=a%2Cb,c`). Malformed values (bad dates, unknown presets) are ignored like unknown
    params; a backwards custom range is swapped.
25. `resultCount` takes `{ shown, total }` and sits right-aligned, just before `actions`.
26. The TanStack adapter also exports `singleSelectFn` (exact match) and `textFn`
    (case-insensitive contains), so every filter type works client-side.
27. The sort chip only renders when a sort is set. Column headers in the demo use TanStack's
    default cycle (ascending → descending → off).
28. `/demo` renders in the browser only (its data is relative to today and its state is in the
    URL), defers table updates behind the toolbar, and virtualises rows. Rationale: instant
    apply stays responsive with 2,000 rows.
29. Phase 5 brings in Nahid's design board: chip anatomy (`× Label Value ▾`, + turning into
    ×), "N items" for multi-select, the "N ago" preset list, "Custom date…" and text filters
    from More Filters in a "Filter by …" dialog, two separate cards in More Filters, the sort
    chip's "Sort:" label and direction menu, context tooltips, 8px popover gaps, 60/400px chip
    widths and a green primary. §4–§9 above are updated to match; this replaces the 24-char
    truncation, "Open, +2" and click-to-toggle sort from the first version of the spec.
30. Chip values truncate with CSS at the chip's max width rather than at a character count.
    Rationale: the design specifies a width; character counts don't track rendered width.
31. The design's rich hover cards (avatar + name + email next to an option, and a list of
    selected people with avatars) and the "Patient" chip aren't built yet. The patient one
    would need MRN/DOB/SSN, which the project rules forbid in demo data; the component could
    support it later through a custom tooltip render prop.
32. The divider under the "selected when opened" group is a line drawn on the first row
    below it, not a separator element, because a listbox may only contain options (axe).
33. The bar has its own accent, `--fb-accent` (default: your `--primary`). Inside chips,
    popovers and dialogs, `--primary` is mapped to it, so shadcn buttons, checkmarks and the
    calendar follow without code changes. Rationale: brand the filter bar without restyling
    the app.
34. Unset chip style is two variables: `--fb-chip-border-style` (dashed/solid) and
    `--fb-chip-unset-border-color` (transparent for "ghost").
35. `FilterBar` takes `tooltips` (default true). Apply mode, tooltips, theme and accent are
    configuration, so the site shows them in a Settings popover, not in the toolbar.
36. The docs site's own primary is shadcn's neutral, so the component's accent stands out;
    the demo accent defaults to the design's green. Theme defaults to light (not the system
    setting) and is remembered per browser.
37. The landing page shows a live toolbar under the headline, before the four problems, so
    a visitor sees the component within seconds. The full table demo follows the problems.
38. Install commands use the site's own address (`{origin}/r/filter-bar.json`), so they're
    right wherever the site is deployed.
39. The result count describes the results, not the filters, so the demos show it under the
    table and previews leave it out. `FilterBar` keeps `resultCount` for apps that want it in
    the bar: its polite announcement is how screen-reader users hear that a filter worked.
40. Previews have no title and use a compact set (Created Date and Status up front, the rest
    in More Filters) so the toolbar stays on one line in a card.
41. The site redesign (component-page layout, "On this page" rail, layered surfaces, detail
    cards, canvas customiser) follows Nahid's references (Vengeance UI, Aceternity, shadcn).
    Customiser choices are shared site-wide, so the whole site previews them.
42. Light-theme `--muted-foreground` is slightly darker than shadcn's default so secondary
    text keeps 4.5:1 on the raised surfaces too (axe).
43. Main page: headline "A filtering framework for data-heavy products", one-line
    description, no tag pills, no footer. The first preview sits on its own (no grey
    frame), with the table veiled so the filter band leads; the veil lifts on hover. A
    "Try it: open a filter" hint blurs in after load and out after ~4 s, or at the first
    interaction (fades only, under reduced motion).
44. The page sits on a faint cutting-mat grid that fades towards the bottom.
45. Detail cards lead with "Rows never jump" and "Humanised dates"; the tiers card's toolbar
    spans the card and wraps left-aligned, so added chips never spill out.
46. The landing preview plays a ghost-cursor tour on the real component (open Status, tick
    two, apply, change the sort, clear), only while on screen, at most three loops. It stops
    at the first real mouse move over the preview, click or key press, closes any popover it
    opened, and lets go of focus after each step. Under reduced motion it's replaced by the
    static "try it" hint.
47. `/why` tells the story from Nahid's article (problems with before/after sketches drawn
    with the real chip styles, principles, craft, process, outcome) and links the article.
    It's in the top bar and linked under the headline.
48. Every page shares a 1200×630 social image (Open Graph and X) rendered with next/og: the
    headline over a filter band. Set `NEXT_PUBLIC_SITE_URL` in production for absolute URLs.
49. Registry: the adapter installs to `components/filter-bar-tanstack/adapter.ts` and imports
    the bar relatively (`../filter-bar/…`), which works both in this repo and once installed;
    the CLI doesn't rewrite custom `@/registry/…` paths. Its dependency on `filter-bar` is a
    URL, written `{{SITE_URL}}` in registry.json and filled in by `pnpm registry:build`.
50. The adapter's filter functions are typed `FilterFn<any>` (like TanStack's built-ins), so
    they fit a column of any row type without a cast. Found by the fresh-app install test.
52. Site chrome: the top bar shows "Filters Framework" (cone icon, Courier Prime) as a plain
    link home, page links (Home, Demo, Customise, Docs, Why) with an underline that tracks
    hover and focus and rests under the current page, and Options / GitHub / theme on the
    right, padded equally from both window edges. Dark is the default theme. Chip radius
    options are 0, 4, 8 and pill (site default 4). A footer credits Nahid (LinkedIn) on Home,
    Docs and Why.
53. /demo: the page is opaque (no grid behind it), the filter band is a raised surface above
    the table, and the table is veiled like the landing preview so the filters lead.
51. Requires a Radix-based shadcn style. Tested in a fresh Next.js app: radix-nova installs,
    typechecks, lints, builds and works; base-nova (Base UI, shadcn's current `--defaults`)
    fails to typecheck (popover/tooltip APIs differ). Supporting Base UI is a follow-up.

## Awkward to implement — suggested changes
Found while building and polishing. Each has a suggestion; none are blocking.
1. **"Enter applies" (§6.1) leaves no key for ticking rows.** Implemented as Space-after-arrows
   (decision 13). Suggest writing that into §6.1 so it's a rule, not a workaround.
2. **`lastDay` is a rolling 24 h; every other preset is whole days.** "1 day ago" therefore
   starts at the current time yesterday, while "3 days ago" starts at midnight. Suggest
   `lastDay` = start of yesterday → end of today, for consistency.
3. **`openEditor(id)` doesn't open anything** — it returns a handle with no side effects.
   Suggest renaming to `getEditor(id)` before the API is public.
4. **Async `options` and chip text.** A chip can only show labels for options that have been
   loaded, so an async filter restored from a URL shows raw values until its editor opens.
   Suggest an optional `getOptionLabel(value)` on the definition for that case.
5. **Clear all "appears only when…" vs a fixed spot.** Both are now true (it's invisible but
   keeps its space). Suggest saying "is hidden" rather than "appears" in §4.
6. **Sort "click toggles" vs the design's chevron.** A chevron promises a menu, so the chip
   opens one (decision 29). If one-click toggling matters, the arrow could flip on click and
   the chevron be dropped.
7. **Custom date shows dates; the design shows date-times** (`2025-07-17 11:00 PM → …`).
   Custom ranges are whole days (§2), so times would always read 12:00 AM / 11:59 PM. Suggest
   keeping dates on the chip and showing times only in the preset tooltip, as now.
54. `/why` became `/case-study` (308 redirect): Nahid's portfolio case study, dark, Fraunces
    headings, visuals first using the live components (hero table, principles, craft cards,
    before/after sketches), three impacts (5× faster filtering, 3+ products on one pattern,
    1 command to install), and a "component system for people and agents" chapter. A
    portfolio card on Framer links straight to it.
55. Agent-ready: `/llms.txt` summarises install and usage for AI tools, and the registry works
    as a named registry (`"@filters": "<site>/r/{name}.json"` in components.json), so
    `shadcn add @filters/filter-bar`, `shadcn search @filters` and the shadcn MCP server can
    find and install it. Verified against the live site.

