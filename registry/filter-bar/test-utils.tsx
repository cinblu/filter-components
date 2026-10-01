// Test-only wiring of useFilters + chips + editors + More Filters menu. Not part of the registry.

import { FilterEditorPanel } from "./editors/filter-editor";
import { FilterChip } from "./filter-chip";
import { MoreFiltersMenu } from "./more-filters-menu";
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

export const createdAtDefinition: FilterDefinition = {
  id: "createdAt",
  label: "Created Date",
  type: "dateRange",
  tier: "quick",
};

export const moreDefinitions: FilterDefinition[] = [
  {
    id: "workflow",
    label: "Workflow",
    type: "singleSelect",
    tier: "more",
    options: [
      { value: "standard", label: "Standard Review" },
      { value: "two-step", label: "Two-step Approval" },
      { value: "redaction", label: "Redaction" },
    ],
  },
  {
    id: "assignee",
    label: "Assignee",
    type: "multiSelect",
    tier: "more",
    options: [
      { value: "avrel", label: "Avrel" },
      { value: "bexa", label: "Bexa" },
      { value: "corvan", label: "Corvan" },
    ],
  },
  {
    id: "source",
    label: "Source",
    type: "multiSelect",
    tier: "more",
    options: [
      { value: "upload", label: "Upload" },
      { value: "email", label: "Email" },
    ],
  },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more" },
];

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
      {[...filters.quickFilters, ...filters.activeMoreFilters].map((definition) => {
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
              <FilterEditorPanel
                definition={definition}
                editor={editor}
                applyMode={filters.applyMode}
                onDone={close}
              />
            )}
          </FilterChip>
        );
      })}
      {filters.moreFilters.length > 0 && <MoreFiltersMenu filters={filters} />}
      <button type="button">Outside</button>
      <output data-testid="applied">{JSON.stringify(filters.applied)}</output>
    </div>
  );
}
