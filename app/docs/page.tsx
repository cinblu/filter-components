import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { CodeBlock } from "@/components/site/code-block";
import { InstallTabs } from "@/components/site/install-tabs";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Docs",
  description: "Install and API reference for the Filter Bar, plus the reasoning behind its details.",
};

const SECTIONS = [
  { id: "install", label: "Install" },
  { id: "quick-start", label: "Quick start" },
  { id: "filter-bar", label: "FilterBar" },
  { id: "definitions", label: "Filter definitions" },
  { id: "use-filters", label: "useFilters" },
  { id: "url-state", label: "URL sync" },
  { id: "tanstack", label: "TanStack adapter" },
  { id: "theming", label: "Theming" },
  { id: "keyboard", label: "Keyboard" },
  { id: "craft", label: "Craft details" },
];

const QUICK_START = `
"use client";

import { useState } from "react";

import { FilterBar } from "@/components/filter-bar/filter-bar";
import type { FilterDefinition, SortState } from "@/components/filter-bar/types";
import { useFilterUrlState } from "@/components/filter-bar/url-state";
import { useFilters } from "@/components/filter-bar/use-filters";

const definitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick" },
  {
    id: "status",
    label: "Status",
    type: "multiSelect",
    tier: "quick",
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more" },
];

export function Documents() {
  const url = useFilterUrlState(definitions); // optional: keep filters in the URL
  const filters = useFilters({ definitions, ...url });
  const [sort, setSort] = useState<SortState>();

  // filters.applied is what to filter by: send it to your API, or see the TanStack adapter.
  return (
    <FilterBar
      filters={filters}
      title={<h1>Documents</h1>}
      sort={sort}
      onSortChange={setSort}
    />
  );
}
`;

const TANSTACK = `
import {
  dateRangeFn, multiSelectFn, singleSelectFn, textFn, toColumnFilters,
} from "@/components/filter-bar-tanstack/adapter";

// Give each column the same id as its filter, and the matching filter function.
const columns = [
  { id: "status", accessorKey: "status", filterFn: multiSelectFn },
  { id: "createdAt", accessorKey: "createdAt", filterFn: dateRangeFn },
  { id: "batchId", accessorKey: "batchId", filterFn: textFn },
];

const columnFilters = useMemo(
  () => toColumnFilters(filters.applied, definitions),
  [filters.applied],
);

const table = useReactTable({
  data,
  columns,
  state: { columnFilters },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
});
`;

const CSS_VARIABLES = `
:root {
  --fb-chip-height: 1.75rem;
  --fb-chip-radius: var(--radius-sm);
  --fb-chip-gap: 0.375rem;
  --fb-chip-border-style: dashed;          /* unset chips: dashed | solid */
  --fb-chip-unset-border-color: var(--border);  /* transparent for a "ghost" chip */
  --fb-chip-min-width: 3.75rem;
  --fb-chip-max-width: 25rem;              /* longer values end in an ellipsis */
  --fb-chip-font-size: 0.8125rem;
  --fb-popover-width: 18rem;
  --fb-density: 1;                         /* 0.875 compact · 1 · 1.125 comfortable */
  --fb-accent: var(--primary);             /* values, Apply, checkmarks, focus borders */
  --fb-accent-foreground: var(--primary-foreground);
}
`;

export default function DocsPage() {
  return (
    <PageShell sections={SECTIONS}>
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Docs</h1>
          <p className="text-sm text-muted-foreground">
            The Filter Bar is source you own: the CLI copies it into{" "}
            <code className="font-mono text-xs">components/filter-bar/</code>, and you can edit
            anything. This page covers the API and why its details work the way they do. For the
            story behind the pattern, see the <Link href="/case-study">case study</Link>.
          </p>
        </header>

        <Section id="install" title="Install">
          <p>
            In a project with Tailwind CSS v4 and shadcn/ui set up with a <strong>Radix-based
            style</strong> (for example <code>npx shadcn@latest init --base radix</code>). Base UI
            styles aren&apos;t supported yet: the popovers use Radix-only APIs.
          </p>
          <InstallTabs />
          <p>
            This adds the files, the shadcn components they use (button, calendar, command,
            dialog, input, popover, separator, tooltip), <code>date-fns</code>,{" "}
            <code>lucide-react</code>, and the <a href="#theming">CSS variables</a>. For
            client-side filtering with TanStack Table, add the adapter as well:
          </p>
          <InstallTabs item="filter-bar-tanstack" />
          <p>Chip tooltips need shadcn&apos;s <code>TooltipProvider</code> somewhere above the bar, usually in your root layout.</p>
        </Section>

        <Section id="quick-start" title="Quick start">
          <p>
            Describe your filters, hand them to <code>useFilters</code>, render{" "}
            <code>FilterBar</code>. The bar shows the chips; you decide what filtering means.
          </p>
          <CodeBlock title="documents.tsx">{QUICK_START}</CodeBlock>
        </Section>

        <Section id="filter-bar" title="FilterBar">
          <p>The toolbar. Filters on the left wrap within their area; Clear all, the count and your actions stay fixed on the right.</p>
          <PropsTable
            rows={[
              ["filters", "UseFiltersResult", "From useFilters(). Required."],
              ["title", "ReactNode", "Shown first, e.g. the table's name."],
              ["search", "{ value, onChange, placeholder? }", "Optional global search. Applies 300 ms after typing stops; no Apply."],
              ["sort / onSortChange", "SortState / (sort?) => void", "Shows the sort chip: “Sort: Created Date  Newest first”."],
              ["resultCount", "{ shown, total }", "“Showing 42 of 1,200”, announced politely to screen readers."],
              ["actions", "ReactNode", "Right-aligned slot for your own buttons."],
              ["tooltips", "boolean", "Hover tooltips on chips. Default true."],
            ]}
          />
          <p>
            <code>SortState</code> is <code>{"{ columnId, label, direction, directionLabels? }"}</code>.
            Pass <code>{"directionLabels: { asc: \"Oldest first\", desc: \"Newest first\" }"}</code>{" "}
            for wording that fits the column; the default is Ascending / Descending.
          </p>
          <p>
            The pieces are exported too, for custom layouts: <code>FilterBarChip</code>,{" "}
            <code>FilterChip</code>, <code>MoreFiltersMenu</code>, <code>SortChip</code> and{" "}
            <code>FilterEditorPanel</code>.
          </p>
        </Section>

        <Section id="definitions" title="Filter definitions">
          <PropsTable
            rows={[
              ["id", "string", "Unique; also the URL parameter and the TanStack column id."],
              ["label", "string", "“Created Date”."],
              ["type", "multiSelect | singleSelect | dateRange | text", "Picks the editor."],
              ["tier", "quick | more", "Quick filters are always visible; the rest live in More Filters until applied."],
              ["description", "string", "Tooltip on the unset chip, e.g. “When the batch arrived”."],
              ["options", "FilterOption[] | () => Promise<FilterOption[]>", "For the select types. A loader runs when the editor first opens, then is cached."],
              ["searchable", "boolean", "Search input in the editor. Default: more than 7 options."],
              ["searchPlaceholder", "string", "Default: the label."],
              ["presets", "DatePresetKey[]", "Date presets to offer. Default: 1 day, 3 days, 1 week, 1/3/6 months, 1 year ago."],
              ["allowCustomRange", "boolean", "Offer “Custom date…”. Default true."],
            ]}
          />
          <p>
            Values: multiSelect is <code>string[]</code>, singleSelect and text are{" "}
            <code>string</code>, dateRange is a preset key or a custom range of ISO dates
            (whole days, inclusive). An empty value means “not set”.
          </p>
        </Section>

        <Section id="use-filters" title="useFilters">
          <p>
            Headless state. It keeps two things apart: <strong>applied</strong> filters (what
            the data is filtered by) and <strong>pending</strong> edits inside an open editor.
          </p>
          <PropsTable
            head={["Option", "Type", ""]}
            rows={[
              ["definitions", "FilterDefinition[]", "Required."],
              ["applyMode", "manual | instant", "Manual (default): edits wait for Apply. Instant: every change applies."],
              ["value / defaultValue", "FilterState", "Controlled or uncontrolled."],
              ["onChange", "(state) => void", "Once per applied change; never for pending edits or no-op changes."],
            ]}
          />
          <PropsTable
            head={["Returns", "Type", ""]}
            rows={[
              ["applied", "FilterState", "Only set values, in the order they were applied."],
              ["isActive(id) / clear(id) / clearAll()", "", "clear and clearAll apply immediately."],
              ["openEditor(id)", "FilterEditor", "{ pending, setPending, apply, reset, canApply, discard }. No side effects."],
              ["quickFilters / moreFilters / activeMoreFilters", "FilterDefinition[]", "The tiers, for custom layouts."],
              ["activeCount", "number", ""],
            ]}
          />
          <p>
            Presets are resolved to dates when you query, never stored as dates:{" "}
            <code>resolvePreset(key, now)</code> or <code>resolveDateRange(value, now)</code>{" "}
            from <code>presets.ts</code>.
          </p>
        </Section>

        <Section id="url-state" title="URL sync">
          <p>
            <code>useFilterUrlState(definitions)</code> returns <code>{"{ value, onChange }"}</code>{" "}
            to spread into <code>useFilters</code>. One parameter per filter:
          </p>
          <CodeBlock>{`?status=open,closed&createdAt=last7d\n?createdAt=2026-04-18_2026-04-24`}</CodeBlock>
          <p>
            Other parameters are left alone; unknown or malformed values are ignored. Changes
            replace the current history entry, so Back doesn&apos;t step through every tick. It
            uses the History API directly, so it works with any router.
          </p>
        </Section>

        <Section id="tanstack" title="TanStack adapter">
          <p>
            For client-side filtering. For server-side, skip it and send{" "}
            <code>filters.applied</code> from <code>onChange</code> to your API.
          </p>
          <CodeBlock>{TANSTACK}</CodeBlock>
        </Section>

        <Section id="theming" title="Theming">
          <p>
            The bar uses your shadcn tokens, plus these variables (installed with the
            component). Every size scales with <code>--fb-density</code>. The{" "}
            <Link href="/customise">customiser</Link> writes overrides for you.
          </p>
          <CodeBlock title="globals.css">{CSS_VARIABLES}</CodeBlock>
          <p>
            <code>--fb-accent</code> colours chip values, Apply buttons, checkmarks and focus
            borders, so the bar can carry a brand colour without changing your app&apos;s{" "}
            <code>--primary</code>. Set it in <code>.dark</code> too if your dark theme needs a
            lighter shade. Nothing animates under <code>prefers-reduced-motion</code>.
          </p>
        </Section>

        <Section id="keyboard" title="Keyboard">
          <PropsTable
            head={["Where", "Key", "Does"]}
            rows={[
              ["Chip", "Enter / Space", "Opens the editor. Focus comes back to the chip when it closes."],
              ["Multi-select", "↑ ↓, then Space", "Moves, then ticks the highlighted row (typing a space searches instead)."],
              ["Multi-select", "Enter", "Applies, when something changed."],
              ["Any editor", "Escape / click outside", "Closes without applying."],
              ["More Filters", "↑ ↓, → or Enter", "Moves; opens the highlighted filter's editor."],
              ["More Filters editor", "← or Escape", "Back to the list (← once the caret is at the start)."],
              ["More Filters list", "Escape", "Closes the menu."],
            ]}
          />
        </Section>

        <Section id="craft" title="Craft details">
          <p>Small decisions that add up. Each one is there for a reason.</p>
          <Detail title="Applied filters are always visible">
            Every applied filter is a chip with its value, so nobody has to open a “Filter (2)”
            menu to remember why rows are missing.
          </Detail>
          <Detail title="Selected options move to the top only when the editor opens">
            Re-sorting while ticking would move rows under the cursor. The order is frozen while
            open, with a line under the group that was selected; it updates next time.
          </Detail>
          <Detail title="Date presets apply in one click, even in manual mode">
            “1 week ago” is the most common choice; making it wait for Apply adds a step for
            nothing. Presets are stored as keys, so a shared link stays relative.
          </Detail>
          <Detail title="× removes a filter straight away">
            Removing is unambiguous, so there&apos;s nothing to confirm. The + of an unset chip
            turns into that ×, so setting a filter reads as one continuous change.
          </Detail>
          <Detail title="Escape and clicking outside throw edits away">
            Predictable, and it avoids running an expensive query by accident. Apply is the only
            way an edit counts.
          </Detail>
          <Detail title="Clear all keeps its place">
            It clears filters but leaves search and sort, and it holds its spot even while
            hidden, so the count next to it never jumps.
          </Detail>
          <Detail title="The sort is a chip">
            Once a wide table scrolls sideways, the sorted column&apos;s header is gone; the chip
            keeps the sort in view.
          </Detail>
          <Detail title="More Filters opens on hover, but carefully">
            A short delay stops a diagonal mouse movement from opening every row it crosses, and
            hover never swaps away from an editor with unapplied changes.
          </Detail>
          <Detail title="Chips grow and shrink smoothly">
            The chip animates to its new width in 150 ms, so neighbours slide rather than jump.
            Long values end in an ellipsis at 400px; the tooltip has the rest.
          </Detail>
        </Section>
    </PageShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-20 flex-col gap-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground [&_strong]:font-medium [&_strong]:text-foreground"
    >
      <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PropsTable({ rows, head = ["Prop", "Type", ""] }: { rows: string[][]; head?: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-xs">
        <thead className="bg-(--surface-raised) text-muted-foreground">
          <tr>
            {head.map((cell, index) => (
              <th key={index} scope="col" className="px-3 py-2 font-medium">
                {cell || <span className="sr-only">Description</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, description], index) => (
            <tr key={index} className="border-t align-top">
              <td className="px-3 py-2 font-mono whitespace-nowrap text-foreground">{name}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground">{type}</td>
              <td className="px-3 py-2">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-(--fb-accent) pl-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p>{children}</p>
    </div>
  );
}
