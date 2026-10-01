// Test-only wiring of useFilters + FilterChip + MultiSelectEditor. Not part of the registry.

import { MultiSelectEditor } from "./editors/multi-select";
import { FilterChip } from "./filter-chip";
import type { FilterDefinition, FilterState } from "./types";
import { type ApplyMode, useFilters } from "./use-filters";

export const queueDefinition: FilterDefinition = {
  id: "queue",
  label: "Queue",
  type: "multiSelect",
  tier: "quick",
  searchPlaceholder: "Queues",
  options: [
    { value: "intake", label: "Intake" },
    { value: "billing", label: "Billing" },
    { value: "legal", label: "Legal Review" },
    { value: "claims", label: "Claims" },
    { value: "archive", label: "Archive" },
    { value: "compliance", label: "Compliance" },
    { value: "underwriting", label: "Underwriting" },
    { value: "contracts", label: "Contracts" },
  ],
};

export const statusDefinition: FilterDefinition = {
  id: "status",
  label: "Status",
  type: "multiSelect",
  tier: "quick",
  options: [
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "closed", label: "Closed" },
  ],
};

export function ChipHarness({
  definitions = [queueDefinition, statusDefinition],
  applyMode = "manual",
  defaultValue,
  onChange,
}: {
  definitions?: FilterDefinition[];
  applyMode?: ApplyMode;
  defaultValue?: FilterState;
  onChange?: (value: FilterState) => void;
}) {
  const filters = useFilters({ definitions, applyMode, defaultValue, onChange });
  return (
    <div>
      {definitions.map((definition) => {
        const editor = filters.openEditor(definition.id);
        return (
          <FilterChip
            key={definition.id}
            definition={definition}
            value={filters.applied[definition.id]}
            onRemove={() => filters.clear(definition.id)}
            onOpenChange={(open) => {
              if (!open) editor.discard();
            }}
          >
            {({ close }) => (
              <MultiSelectEditor
                definition={definition}
                editor={editor}
                applyMode={filters.applyMode}
                onDone={close}
              />
            )}
          </FilterChip>
        );
      })}
      <button type="button">Outside</button>
      <output data-testid="applied">{JSON.stringify(filters.applied)}</output>
    </div>
  );
}
