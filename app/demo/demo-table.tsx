"use client";

import {
  type ColumnDef,
  type FilterFn,
  type Row,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useDeferredValue, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  ASSIGNEES,
  type DemoRow,
  QUEUES,
  SOURCES,
  STATUSES,
  WORKFLOWS,
  generateDemoRows,
} from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/registry/filter-bar/filter-bar";
import type { FilterDefinition, FilterOption, SortState } from "@/registry/filter-bar/types";
import { useFilterUrlState } from "@/registry/filter-bar/url-state";
import { type ApplyMode, useFilters } from "@/registry/filter-bar/use-filters";
import {
  dateRangeFn,
  multiSelectFn,
  singleSelectFn,
  textFn,
  toColumnFilters,
} from "@/registry/filter-bar-tanstack/adapter";

// Option values are URL-friendly slugs ("legal-review"); labels are what people see.
const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");
const toOptions = (labels: readonly string[]): FilterOption[] =>
  labels.map((label) => ({ value: slug(label), label }));

// SPEC §12: quick = Created Date, Queue, Status. More = Workflow, Assignee, Source, Batch ID.
const definitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick", presets: ["lastDay", "last7d", "last30d", "lastMonth", "thisMonth"] },
  { id: "queue", label: "Queue", type: "multiSelect", tier: "quick", options: toOptions(QUEUES), searchPlaceholder: "Queues" },
  { id: "status", label: "Status", type: "multiSelect", tier: "quick", options: toOptions(STATUSES) },
  { id: "workflow", label: "Workflow", type: "singleSelect", tier: "more", options: toOptions(WORKFLOWS), searchPlaceholder: "Workflows" },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "more", options: toOptions(ASSIGNEES), searchPlaceholder: "Assignees" },
  { id: "source", label: "Source", type: "multiSelect", tier: "more", options: toOptions(SOURCES) },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more", searchPlaceholder: "Contains, e.g. 1004" },
];

const STATUS_DOT: Record<string, string> = {
  Initial: "bg-border",
  "In Review": "bg-muted-foreground",
  Committed: "bg-primary",
  Failed: "bg-destructive",
};

// Columns share ids with the filter definitions, so the adapter's columnFilters line up.
// Select columns are keyed by slug for filtering and render the label.
const columns: ColumnDef<DemoRow>[] = [
  { id: "batchId", header: "Batch ID", accessorKey: "batchId", filterFn: textFn as FilterFn<DemoRow>, size: 180, meta: { mono: true } },
  { id: "createdAt", header: "Created Date", accessorKey: "createdAt", filterFn: dateRangeFn as FilterFn<DemoRow>, size: 230, cell: ({ getValue }) => format(new Date(getValue<string>()), "MMM d, yyyy, HH:mm") },
  { id: "queue", header: "Queue", accessorFn: (row) => slug(row.queue), filterFn: multiSelectFn as FilterFn<DemoRow>, size: 220, cell: ({ row }) => row.original.queue },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => slug(row.status),
    filterFn: multiSelectFn as FilterFn<DemoRow>,
    size: 170,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className={cn("size-1.5 rounded-full", STATUS_DOT[row.original.status])} />
        {row.original.status}
      </span>
    ),
  },
  { id: "workflow", header: "Workflow", accessorFn: (row) => slug(row.workflow), filterFn: singleSelectFn as FilterFn<DemoRow>, size: 240, cell: ({ row }) => row.original.workflow },
  { id: "assignee", header: "Assignee", accessorFn: (row) => slug(row.assignee), filterFn: multiSelectFn as FilterFn<DemoRow>, size: 180, cell: ({ row }) => row.original.assignee },
  { id: "pages", header: "Pages", accessorKey: "pages", size: 120, meta: { numeric: true } },
  { id: "source", header: "Source", accessorFn: (row) => slug(row.source), filterFn: multiSelectFn as FilterFn<DemoRow>, size: 160, cell: ({ row }) => row.original.source },
];

const COLUMN_LABELS = Object.fromEntries(columns.map((c) => [c.id, String(c.header)]));

// Global search looks at what people see, not the slugs.
const searchRow: FilterFn<DemoRow> = (row, _columnId, query: string) => {
  const needle = query.trim().toLowerCase();
  const { batchId, queue, workflow, status, assignee, source } = row.original;
  return [batchId, queue, workflow, status, assignee, source].some((v) => v.toLowerCase().includes(needle));
};

interface ColumnMeta {
  mono?: boolean;
  numeric?: boolean;
}

export function DemoTable() {
  const [data] = useState(() => generateDemoRows());
  const [applyMode, setApplyMode] = useState<ApplyMode>("manual");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);

  const url = useFilterUrlState(definitions);
  const filters = useFilters({ definitions, applyMode, ...url });
  // The toolbar updates straight away; the 2,000-row table follows a moment later and can be
  // interrupted by the next click. Keeps instant apply responsive while ticking quickly.
  const deferredApplied = useDeferredValue(filters.applied);
  const deferredSearch = useDeferredValue(search);
  const columnFilters = useMemo(() => toColumnFilters(deferredApplied, definitions), [deferredApplied]);

  // TanStack Table returns functions React Compiler can't memoize; this app doesn't use the
  // compiler, so the warning is only informational.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter: deferredSearch },
    onSortingChange: setSorting,
    globalFilterFn: searchRow,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // The table's sorting ↔ the toolbar's sort chip.
  const sort: SortState | undefined = sorting[0] && {
    columnId: sorting[0].id,
    label: COLUMN_LABELS[sorting[0].id] ?? sorting[0].id,
    direction: sorting[0].desc ? "desc" : "asc",
  };
  const onSortChange = (next: SortState | undefined) =>
    setSorting(next ? [{ id: next.columnId, desc: next.direction === "desc" }] : []);

  const rows = table.getRowModel().rows;

  // Only the rows in view (plus a margin) are in the DOM. Filtering 2,000 fully rendered rows
  // took up to ~250 ms whenever many rows came back; with this it's a few milliseconds.
  // The sticky header sits above the first row; the overscan covers that small offset.
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 37,
    overscan: 12,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const paddingTop = virtualRows[0]?.start ?? 0;
  const paddingBottom = virtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0);

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b px-4 py-3">
        <FilterBar
          filters={filters}
          title={<h1 className="text-base font-semibold">Document queue</h1>}
          search={{ value: search, onChange: setSearch, placeholder: "Search batches" }}
          sort={sort}
          onSortChange={onSortChange}
          resultCount={{ shown: rows.length, total: data.length }}
          actions={<ApplyModeToggle value={applyMode} onChange={setApplyMode} />}
        />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                  const SortIcon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ChevronsUpDownIcon;
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      className={cn(
                        "sticky top-0 z-10 border-b bg-background px-4 py-2 text-left font-medium text-muted-foreground",
                        meta?.numeric && "text-right",
                      )}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                          sorted && "text-foreground",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon aria-hidden className={cn("size-3.5", !sorted && "opacity-40")} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualRows.map((item) => (
              <DataRow
                key={rows[item.index].id}
                row={rows[item.index]}
                index={item.index}
                measureRef={virtualizer.measureElement}
              />
            ))}
            {paddingBottom > 0 && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
            <p>No batches match these filters.</p>
            {filters.activeCount > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={filters.clearAll}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Rows keep their identity across filtering, so a memoised row only re-renders when it
// moves to a different position.
const DataRow = memo(function DataRow({
  row,
  index,
  measureRef,
}: {
  row: Row<DemoRow>;
  index: number;
  measureRef: (node: HTMLTableRowElement | null) => void;
}) {
  return (
    <tr ref={measureRef} data-index={index} className="hover:bg-muted/50">
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
        return (
          <td
            key={cell.id}
            className={cn(
              "border-b px-4 py-2 whitespace-nowrap",
              meta?.numeric && "text-right tabular-nums",
              meta?.mono && "font-mono text-xs",
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
});

function ApplyModeToggle({ value, onChange }: { value: ApplyMode; onChange: (mode: ApplyMode) => void }) {
  return (
    <div role="group" aria-label="Apply filters" className="inline-flex rounded-md border p-0.5 text-xs">
      {(["manual", "instant"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "rounded-sm px-2 py-0.5 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            value === mode && "bg-secondary text-secondary-foreground",
          )}
        >
          {mode === "manual" ? "Manual apply" : "Instant apply"}
        </button>
      ))}
    </div>
  );
}
