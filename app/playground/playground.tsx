"use client";

import { useState } from "react";

import { MultiSelectEditor } from "@/registry/filter-bar/editors/multi-select";
import { FilterChip } from "@/registry/filter-bar/filter-chip";
import type { FilterDefinition, FilterOption } from "@/registry/filter-bar/types";
import { type ApplyMode, type UseFiltersResult, useFilters } from "@/registry/filter-bar/use-filters";
import { ASSIGNEES, QUEUES, STATUSES } from "@/lib/demo-data";

const toOptions = (labels: readonly string[]): FilterOption[] =>
  labels.map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "-"), label }));

const definitions: FilterDefinition[] = [
  { id: "queue", label: "Queue", type: "multiSelect", tier: "quick", options: toOptions(QUEUES), searchPlaceholder: "Queues" },
  { id: "status", label: "Status", type: "multiSelect", tier: "quick", options: toOptions(STATUSES) },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "quick", options: toOptions(ASSIGNEES), searchPlaceholder: "Assignees" },
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

function MultiSelectChip({ filters, definition }: { filters: UseFiltersResult; definition: FilterDefinition }) {
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
        <MultiSelectEditor definition={definition} editor={editor} applyMode={filters.applyMode} onDone={close} />
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
          {definitions.map((definition) => (
            <MultiSelectChip key={definition.id} filters={filters} definition={definition} />
          ))}
        </div>
        <pre className="rounded-md bg-muted p-3 text-xs">{JSON.stringify(filters.applied, null, 2)}</pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">500 options</h2>
        <div className="flex flex-wrap items-center gap-[var(--fb-chip-gap,0.375rem)]">
          <MultiSelectChip filters={stress} definition={stressDefinitions[0]} />
        </div>
      </section>
    </main>
  );
}
