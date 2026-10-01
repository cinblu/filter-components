# Build phases

Paste each prompt into Claude Code one at a time. After each phase, run `pnpm dev`, go
through the **You check** list in the browser, and give feedback before moving on.

---

## Phase 0 — Scaffold
**Prompt**
> Read CLAUDE.md, SPEC.md and PHASES.md. Then do Phase 0 only: scaffold a Next.js (App
> Router, TypeScript strict) app with pnpm, Tailwind v4 and shadcn/ui, initialised in this
> folder. Add Vitest + React Testing Library and Playwright, and make all the scripts listed
> in CLAUDE.md exist and pass (empty test suites are fine). Create the folder structure from
> CLAUDE.md with placeholder files. Set up a `registry.json` for the shadcn registry and a
> `registry:build` script, checking the current shadcn registry docs for the format. Add the
> seeded synthetic dataset in `lib/demo-data.ts` as described in SPEC §12. Commit and stop.

**You check:** `pnpm dev` shows a blank page with no errors. `pnpm test` passes.

---

## Phase 1 — Headless core
**Prompt**
> Phase 1: implement `types.ts`, `presets.ts` and `use-filters.ts` exactly as described in
> SPEC §2, §3 and §6.2 (preset definitions). Write tests for every `[T]` rule in those
> sections, including the date preset boundaries (use a fixed "now"). No UI yet. Commit and
> stop with a summary of the hook's public API.

**You check:** read the API summary. Does it match how you'd want to use it?

---

## Phase 2 — Chip + multi-select editor
**Prompt**
> Phase 2: build `FilterChip` (SPEC §5) and the multi-select editor (SPEC §6.1), wired to
> `useFilters`. Add a temporary `/playground` page with three chips (two multi-select, one
> unset) using the demo data's Queue and Status options. Pay special attention to the
> selected-first ordering being frozen while open, Select All acting on visible options only,
> and Apply being disabled until something changes. Cover every `[T]` rule in §5 and §6.1
> with component tests. Commit and stop.

**You check:**
- The dashed → filled chip transition feels right (speed, no jumpiness).
- Select three queues, apply, reopen: are they at the top? Tick another while it's open: does
  anything jump? (It shouldn't.)
- Escape and clicking outside discard. × removes without opening the editor.
- Tab through everything with the keyboard only.

---

## Phase 3 — Date range + More Filters menu
**Prompt**
> Phase 3: build the date-range editor (SPEC §6.2), the single-select and text editors
> (§6.3), and the More Filters menu with nested editors (§7), including the narrow-screen
> behaviour with a back button. Add them to `/playground`. Cover all `[T]` rules with tests,
> and add one Playwright test for the full keyboard flow in §7. Commit and stop.

**You check:**
- One click on "Last 7 days" applies and closes.
- More Filters → hover "Workflow" → the nested panel opens to the right. Apply → a new chip
  appears in the toolbar. Clear it → it goes back into the menu.
- Resize the browser below 640px and try the menu again.

---

## Phase 4 — Toolbar, sort chip, demo table, URL sync
**Prompt**
> Phase 4: build `FilterBar` (SPEC §4) and `SortChip` (§8), `url-state.ts` (§11), and the
> TanStack adapter as a separate registry folder (§11). Build `/demo` as in SPEC §12: a
> full-page TanStack table over the 2,000-row dataset with horizontal scroll, column sorting
> wired to the sort chip, all filter types, and a manual/instant apply toggle. Filters sync to
> the URL. Cover all `[T]` rules. Commit and stop.

**You check:**
- Sort by a column, scroll the table sideways: the sort is still visible in the toolbar.
- Apply some filters, copy the URL, open it in a new tab: same state.
- Does the toolbar wrap nicely at tablet width?
- Does the table feel calm with manual apply on, and responsive with instant apply?

---

## Phase 5 — Craft pass
**Prompt**
> Phase 5: a polish and accessibility pass against SPEC §9 and §10. Move all sizing onto the
> `--fb-*` variables. Check the aria-labels, focus return, reduced motion, and contrast in light
> and dark. Run an automated accessibility check (axe) on `/demo` in Playwright and fix the
> issues. List anything in the spec you found awkward to implement, with a suggested change.
> Commit and stop.

**You check:** this is your phase. Go through the motion, spacing and density in detail and
send specific notes. Expect a round or two of back-and-forth here.

---

## Phase 6 — Docs site + customiser
**Prompt**
> Phase 6: build `/`, `/customise` and `/docs` as described in SPEC §12. The landing page
> leads with the four problems → fixes, then the live demo, then the install command. The
> customiser edits the `--fb-*` variables and the accent live, and has "Copy CSS". Keep the
> docs site's own design restrained so the component is the focus. Remove `/playground`.
> Commit and stop.

**You check:** would a stranger understand the point within 10 seconds of landing? Is the
customiser output actually paste-able?

---

## Phase 7 — Registry, install test, release
**Prompt**
> Phase 7: finish the registry items (SPEC §13). Then prove the install works: create a fresh
> Next.js + shadcn app in a temp folder outside this repo, install `filter-bar` and
> `filter-bar-tanstack` from the local build, typecheck it, and render a minimal example.
> Fix anything that breaks. Write the README (pitch, install, minimal usage, link to the
> article, licence MIT). Commit and stop. Tell me exactly what I need to do to deploy to Vercel
> and publish the repo on GitHub.

**You check:** deploy, then run the install command against the live URL yourself in a
new project.
