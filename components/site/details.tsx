"use client";

// "The details": each card isolates one interaction, using the real components, with a
// one-line reason underneath. Kept small on purpose: one idea per card.

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, RotateCcwIcon } from "lucide-react";
import { type ReactNode, useMemo, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";
import { ASSIGNEES, QUEUES, SOURCES, STATUSES, WORKFLOWS } from "@/lib/demo-data";
import { useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { DateRangeEditor } from "@/registry/filter-bar/editors/date-range";
import { MultiSelectEditor } from "@/registry/filter-bar/editors/multi-select";
import { FilterBar, FilterBarChip } from "@/registry/filter-bar/filter-bar";
import { SortChip } from "@/registry/filter-bar/sort-chip";
import { formatDateRangeDetail } from "@/registry/filter-bar/summary";
import type { FilterDefinition, FilterOption, SortState } from "@/registry/filter-bar/types";
import { serializeFilterQuery } from "@/registry/filter-bar/url-state";
import { useFilters } from "@/registry/filter-bar/use-filters";

import { containedScroll, installContainedScroll } from "./contained-scroll";
import { Frame } from "./frame";

installContainedScroll();

const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");
const toOptions = (labels: readonly string[]): FilterOption[] =>
  labels.map((label) => ({ value: slug(label), label }));

/** A detail card: the interaction on a stage, then what it is and why. */
function DetailCard({
  title,
  why,
  children,
  className,
  stageClassName,
  grid = true,
}: {
  title: string;
  why: ReactNode;
  children: ReactNode;
  className?: string;
  stageClassName?: string;
  grid?: boolean;
}) {
  return (
    <Frame
      grid={grid}
      className={className}
      stageClassName={cn("flex items-center justify-center p-6", stageClassName)}
      footer={
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-[13px] text-pretty text-muted-foreground">{why}</p>
        </div>
      }
    >
      {children}
    </Frame>
  );
}

/** The popover surface, for editors shown inline on a stage. */
const inlineEditor = "overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10";

// --- + becomes × ----------------------------------------------------------------------

const statusDefinition: FilterDefinition[] = [
  { id: "status", label: "Status", type: "singleSelect", tier: "quick", options: toOptions(STATUSES) },
];

function AddRemove() {
  const { applyMode, tooltips } = useSiteSettings();
  const filters = useFilters({ definitions: statusDefinition, applyMode });
  return (
    <div className="flex flex-col items-center gap-3">
      <FilterBarChip filters={filters} definition={statusDefinition[0]} tooltip={tooltips} />
      <p className="text-xs text-muted-foreground">
        {filters.isActive("status") ? "Now press the ×" : "Pick a status"}
      </p>
    </div>
  );
}

// --- Selected-first, frozen while open ---------------------------------------------------

const queueDefinition: FilterDefinition = {
  id: "queue",
  label: "Queue",
  type: "multiSelect",
  tier: "quick",
  options: toOptions(QUEUES),
  searchPlaceholder: "Queues",
};

function FrozenOrder() {
  const { applyMode } = useSiteSettings();
  const filters = useFilters({
    definitions: [queueDefinition],
    applyMode,
    defaultValue: { queue: ["contracts", "returns"] },
  });
  // Each "reopen" remounts the editor, the same as closing and opening its popover.
  const [opened, setOpened] = useState(0);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className={inlineEditor} {...containedScroll}>
        <MultiSelectEditor
          key={opened}
          definition={queueDefinition}
          editor={filters.openEditor("queue")}
          applyMode={applyMode}
          onDone={() => setOpened((n) => n + 1)}
          // Don't pull focus into a card on page load.
          autoFocus={false}
        />
      </div>
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpened((n) => n + 1)}>
        <RotateCcwIcon aria-hidden />
        Reopen the list
      </Button>
    </div>
  );
}

// --- One-click date presets ----------------------------------------------------------

const createdAtDefinition: FilterDefinition = {
  id: "createdAt",
  label: "Created Date",
  type: "dateRange",
  tier: "quick",
};

function OneClickDates() {
  const { applyMode, tooltips } = useSiteSettings();
  const filters = useFilters({
    definitions: [createdAtDefinition],
    applyMode,
    defaultValue: { createdAt: { kind: "preset", preset: "last7d" } },
  });
  const value = filters.applied.createdAt;
  // "Today" depends on the viewer's clock and time zone, so it's only shown in the browser.
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const query = serializeFilterQuery(filters.applied, [createdAtDefinition]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <FilterBarChip filters={filters} definition={createdAtDefinition} tooltip={tooltips} />
      <div className={cn(inlineEditor, "[&_[cmdk-list]]:max-h-none")} {...containedScroll}>
        <DateRangeEditor
          definition={createdAtDefinition}
          editor={filters.openEditor("createdAt")}
          applyMode={applyMode}
          onDone={() => {}}
          autoFocus={false}
        />
      </div>
      <dl className="grid w-full max-w-80 grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <dt>URL</dt>
        <dd className="truncate text-foreground">{query || "—"}</dd>
        <dt>Today</dt>
        <dd className="truncate">
          {inBrowser && value && typeof value === "object" && !Array.isArray(value)
            ? formatDateRangeDetail(value)
            : "—"}
        </dd>
      </dl>
    </div>
  );
}

// --- Sort that doesn't scroll away ---------------------------------------------------

interface MiniRow {
  id: string;
  queue: string;
  status: string;
  workflow: string;
  assignee: string;
  pages: number;
  source: string;
}

// A few fixed rows (no dates, so server and browser render the same thing).
const MINI_ROWS: MiniRow[] = [
  [QUEUES[0], STATUSES[2], WORKFLOWS[0], ASSIGNEES[3], 42, SOURCES[0]],
  [QUEUES[2], STATUSES[1], WORKFLOWS[3], ASSIGNEES[7], 7, SOURCES[1]],
  [QUEUES[1], STATUSES[3], WORKFLOWS[5], ASSIGNEES[1], 118, SOURCES[3]],
  [QUEUES[3], STATUSES[2], WORKFLOWS[1], ASSIGNEES[12], 3, SOURCES[0]],
  [QUEUES[5], STATUSES[0], WORKFLOWS[6], ASSIGNEES[5], 64, SOURCES[2]],
].map(([queue, status, workflow, assignee, pages, source], i) => ({
  id: `B-${10241 + i * 37}`,
  queue: String(queue),
  status: String(status),
  workflow: String(workflow),
  assignee: String(assignee),
  pages: Number(pages),
  source: String(source),
}));

const MINI_COLUMNS: { id: keyof MiniRow; label: string; numeric?: boolean }[] = [
  { id: "id", label: "Batch ID" },
  { id: "queue", label: "Queue" },
  { id: "status", label: "Status" },
  { id: "workflow", label: "Workflow" },
  { id: "assignee", label: "Assignee" },
  { id: "source", label: "Source" },
  { id: "pages", label: "Pages", numeric: true },
];

function SortStaysVisible() {
  const [sort, setSort] = useState<SortState | undefined>({
    columnId: "pages",
    label: "Pages",
    direction: "desc",
    directionLabels: { asc: "Fewest first", desc: "Most first" },
  });
  const rows = useMemo(() => {
    if (!sort) return MINI_ROWS;
    const key = sort.columnId as keyof MiniRow;
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...MINI_ROWS].sort((a, b) => (a[key] > b[key] ? sign : a[key] < b[key] ? -sign : 0));
  }, [sort]);

  const sortBy = (column: (typeof MINI_COLUMNS)[number]) => {
    const same = sort?.columnId === column.id;
    setSort({
      columnId: column.id,
      label: column.label,
      direction: same && sort?.direction === "asc" ? "desc" : "asc",
      directionLabels: column.numeric
        ? { asc: "Fewest first", desc: "Most first" }
        : { asc: "A to Z", desc: "Z to A" },
    });
  };

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        {sort ? (
          <SortChip sort={sort} onSortChange={setSort} />
        ) : (
          <span className="text-xs text-muted-foreground">Click a column header to sort</span>
        )}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">Scroll the table sideways →</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-sm">
          <thead>
            <tr>
              {MINI_COLUMNS.map((column) => {
                const active = sort?.columnId === column.id ? sort.direction : undefined;
                const Icon = active === "asc" ? ArrowUpIcon : active === "desc" ? ArrowDownIcon : ChevronsUpDownIcon;
                return (
                  <th
                    key={column.id}
                    aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}
                    className={cn("border-b px-4 py-2 font-medium text-muted-foreground", column.numeric ? "text-right" : "text-left")}
                  >
                    <button
                      type="button"
                      onClick={() => sortBy(column)}
                      className={cn(
                        "inline-flex w-36 items-center gap-1 rounded-sm outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                        column.numeric && "w-20 justify-end",
                        active && "text-foreground",
                      )}
                    >
                      {column.label}
                      <Icon aria-hidden className={cn("size-3.5", !active && "opacity-40")} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {MINI_COLUMNS.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-2 whitespace-nowrap",
                      column.numeric && "text-right tabular-nums",
                      column.id === "id" && "font-mono text-xs",
                    )}
                  >
                    {row[column.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Two tiers --------------------------------------------------------------------

const tierDefinitions: FilterDefinition[] = [
  { id: "status", label: "Status", type: "multiSelect", tier: "quick", options: toOptions(STATUSES) },
  { id: "workflow", label: "Workflow", type: "singleSelect", tier: "more", options: toOptions(WORKFLOWS), searchPlaceholder: "Workflows" },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "more", options: toOptions(ASSIGNEES), searchPlaceholder: "Assignees" },
  { id: "source", label: "Source", type: "multiSelect", tier: "more", options: toOptions(SOURCES) },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more", searchPlaceholder: "e.g. 1004" },
];

function TwoTiers() {
  const { applyMode, tooltips } = useSiteSettings();
  const filters = useFilters({ definitions: tierDefinitions, applyMode });
  return <FilterBar filters={filters} tooltips={tooltips} className="justify-center [&>div:first-child]:flex-none" />;
}

// --- The section ------------------------------------------------------------------

export function Details() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DetailCard
        title="Add and remove with one control"
        why="The + turns into the × that removes the filter, and the chip eases to its new width, so neighbours slide instead of jump."
        stageClassName="min-h-48"
      >
        <AddRemove />
      </DetailCard>
      <DetailCard
        title="Important filters up front"
        why="A few quick filters stay visible. The rest are one search away in More Filters, and show as chips once they're used."
        stageClassName="min-h-48"
      >
        <TwoTiers />
      </DetailCard>
      <DetailCard
        title="Rows never jump under your cursor"
        why="Selected options move to the top when the list opens, then stay put while you tick. Reopen it to see the new order."
      >
        <FrozenOrder />
      </DetailCard>
      <DetailCard
        title="Common dates in one click"
        why="Presets apply straight away, even with manual apply. They're saved as “1 week ago”, not as dates, so a shared link stays relative."
      >
        <OneClickDates />
      </DetailCard>
      <DetailCard
        className="md:col-span-2"
        grid={false}
        title="Sort that doesn't scroll away"
        why="On a wide table the sorted column's header scrolls out of view. The sort chip keeps it in the toolbar, where you can flip or clear it."
        stageClassName="items-stretch justify-stretch p-0 overflow-hidden"
      >
        <SortStaysVisible />
      </DetailCard>
    </div>
  );
}
