"use client";

import { useState } from "react";

import { FilterEditorPanel } from "@/registry/filter-bar/editors/filter-editor";
import { FilterChip } from "@/registry/filter-bar/filter-chip";
import { MoreFiltersMenu } from "@/registry/filter-bar/more-filters-menu";
import type { FilterDefinition, FilterOption } from "@/registry/filter-bar/types";
import { type ApplyMode, type UseFiltersResult, useFilters } from "@/registry/filter-bar/use-filters";
import { ASSIGNEES, QUEUES, SOURCES, STATUSES, WORKFLOWS } from "@/lib/demo-data";

const toOptions = (labels: readonly string[]): FilterOption[] =>
  labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

const definitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick" },
  { id: "queue", label: "Queue", type: "multiSelect", tier: "quick", options: toOptions(QUEUES), searchPlaceholder: "Queues" },
  { id: "status", label: "Status", type: "multiSelect", tier: "quick", options: toOptions(STATUSES) },
  { id: "workflow", label: "Workflow", type: "singleSelect", tier: "more", options: toOptions(WORKFLOWS) },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "more", options: toOptions(ASSIGNEES), searchPlaceholder: "Assignees" },
  { id: "source", label: "Source", type: "multiSelect", tier: "more", options: toOptions(SOURCES) },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more", searchPlaceholder: "e.g. B-10042" },
];

// 500 synthetic options, to check the editor stays smooth (SPEC §6.1).
const stressDefinitions: FilterDefinition[] = [
  {
    id: "tag",
    label: "Tag",
    type: "multiSelect",
    tier: "quick",
    options: Array.from({ length: 500 }, (_, i) => ({ value: `tag-${i + 1}`, label: `Tag ${String(i + 1).padStart(3, "0")}` })),
  },
];

function EditableChip({ filters, definition }: { filters: UseFiltersResult; definition: FilterDefinition }) {
  const editor = filters.openEditor(definition.id);
  return (
    <FilterChip
      definition={definition}
      value={filters.applied[definition.id]}
      onRemove={() => filters.clear(definition.id)}
      // Escape, clicking outside and closing after Apply all end here. Discarding is a no-op
      // after Apply, and throws the edit away otherwise.
      onOpenChange={(open) => {
        if (!open) editor.discard();
      }}
    >
      {({ close }) => (
        <FilterEditorPanel definition={definition} editor={editor} applyMode={filters.applyMode} onDone={close} />
      )}
    </FilterChip>
  );
}

export function Playground() {
  const [applyMode, setApplyMode] = useState<ApplyMode>("manual");
  const filters = useFilters({
    definitions,
    applyMode,
    defaultValue: { queue: ["intake", "billing", "legal-review"], status: ["in-review"] },
  });
  const stress = useFilters({ definitions: stressDefinitions, applyMode });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Playground</h1>
        <p className="text-sm text-muted-foreground">Temporary page for checking components while they&apos;re built.</p>
      </header>

      <fieldset className="flex items-center gap-4 text-sm">
        <legend className="sr-only">Apply mode</legend>
        {(["manual", "instant"] as const).map((mode) => (
          <label key={mode} className="flex items-center gap-1.5">
            <input type="radio" name="apply-mode" checked={applyMode === mode} onChange={() => setApplyMode(mode)} />
            {mode === "manual" ? "Manual apply" : "Instant apply"}
          </label>
        ))}
      </fieldset>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Chips</h2>
        <div className="flex flex-wrap items-center gap-[var(--fb-chip-gap,0.375rem)]">
          {[...filters.quickFilters, ...filters.activeMoreFilters].map((definition) => (
            <EditableChip key={definition.id} filters={filters} definition={definition} />
          ))}
          <MoreFiltersMenu filters={filters} />
        </div>
        <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(filters.applied, null, 2)}</pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">500 options</h2>
        <div className="flex flex-wrap items-center gap-[var(--fb-chip-gap,0.375rem)]">
          <EditableChip filters={stress} definition={stressDefinitions[0]} />
        </div>
      </section>
    </main>
  );
}
