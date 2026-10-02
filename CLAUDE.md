# Filter Bar — project context for Claude Code

## What we're building
An open-source, modular filtering component for data-heavy tables, distributed as a
**shadcn-compatible registry item** so people can install the source into their own
project with `npx shadcn add <url>`. It ships with a docs site that has a live demo
and a theme customiser.

The design comes from Nahid's article "Crafting a modular filtering framework for
data-heavy applications". `SPEC.md` is the source of truth for behaviour. If code and
SPEC disagree, the SPEC wins — or stop and ask.

## How to work in this repo
- Read `SPEC.md` and `PHASES.md` at the start of every session.
- Work **one phase at a time**. At the end of a phase: run all checks, commit, then stop
  and give a short summary (what was built, what to look at in the browser, any spec
  questions). Do not start the next phase until asked.
- When the spec is ambiguous, pick the option closest to the spirit of the article
  (data first, quiet UI, predictable interactions), write the decision into the
  "Decisions log" at the bottom of SPEC.md, and mention it in your summary.
- Interaction rules in SPEC.md are written to be testable. Each rule tagged `[T]` must
  have at least one test.
- Before using shadcn/ui, Tailwind, Next.js, TanStack Table or react-day-picker APIs,
  check their current docs rather than relying on memory. Versions change.

## Stack
- Next.js (App Router, latest stable), React, TypeScript (strict)
- Tailwind CSS v4, shadcn/ui (Popover, Command, Checkbox, Button, Calendar, Input,
  Separator, Badge, Tooltip as needed)
- TanStack Table v8 (demo + optional adapter only — the core must not depend on it)
- @tanstack/react-virtual (demo table only, to keep 2,000 rows smooth; not in the registry)
- date-fns for date maths
- Vitest + React Testing Library for unit/component tests; Playwright for a small set of
  end-to-end interaction tests
- pnpm

## Commands (keep these working)
- `pnpm dev` — docs site + demo
- `pnpm test` — unit + component tests
- `pnpm test:e2e` — Playwright
- `pnpm typecheck`, `pnpm lint`
- `pnpm registry:build` — builds registry JSON into `public/r/`

## Code structure
```
registry/
  filter-bar/
    use-filters.ts          # headless state: definitions, pending vs applied, apply mode
    filter-bar.tsx          # toolbar layout
    filter-chip.tsx         # dashed "+ Label" ↔ filled "Label: value" chip
    more-filters-menu.tsx   # searchable menu with nested editors
    editors/
      filter-editor.tsx     # picks the editor for a filter type
      filter-dialog.tsx     # "Filter by …" modal (custom date, text from More Filters)
      multi-select.tsx
      single-select.tsx
      date-range.tsx
      text.tsx
    sort-chip.tsx
    presets.ts              # date presets, resolved at query time
    summary.ts              # chip summary text ("Status: Open, +2")
    options.ts              # static or async option loading, cached
    styles.ts               # shared chip/popover classes, all sized by --fb-* variables
    url-state.ts            # optional URL sync
    types.ts
  filter-bar-tanstack/
    adapter.ts              # maps applied filters to TanStack columnFilters
app/                        # site: /, /demo, /customise, /docs, /case-study, /llms.txt
components/site/            # site-only UI (header + Settings, code blocks, pickers)
lib/site-settings.ts        # theme, accent, tooltips, apply mode for the demos
lib/demo-data.ts            # synthetic, seeded data only
```

## Rules
- **No real data.** Demo data must be synthetic and generated with a fixed seed. No
  patient-like fields (MRN, DOB, addresses), no real names or real email domains.
- The registry code is code people will copy and edit. Prefer clear, flat code over
  clever abstractions. Comment the non-obvious behaviour (e.g. why selected items are
  reordered only when the menu opens).
- Don't add a dependency without saying why in the phase summary. The core component
  should need only shadcn primitives, date-fns and lucide-react.
- Styling uses shadcn CSS variables plus the component-level variables defined in
  SPEC.md §8. No hard-coded colours in components.
- Respect `prefers-reduced-motion` everywhere.
- Never mark a phase done with failing typecheck, lint or tests.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
