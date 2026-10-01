// Filter definitions for the synthetic document queue (SPEC §12), shared by the demo table,
// the landing page and the customiser.

import { ASSIGNEES, QUEUES, SOURCES, STATUSES, WORKFLOWS } from "@/lib/demo-data";
import type { FilterDefinition, FilterOption } from "@/registry/filter-bar/types";

// Option values are URL-friendly slugs ("legal-review"); labels are what people see.
export const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");
const toOptions = (labels: readonly string[]): FilterOption[] =>
  labels.map((label) => ({ value: slug(label), label }));

// SPEC §12: quick = Created Date, Queue, Status. More = Workflow, Assignee, Source, Batch ID.
export const demoFilterDefinitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick", description: "When the batch arrived" },
  { id: "queue", label: "Queue", type: "multiSelect", tier: "quick", options: toOptions(QUEUES), searchPlaceholder: "Queues", description: "Which team's queue the batch is in" },
  { id: "status", label: "Status", type: "multiSelect", tier: "quick", options: toOptions(STATUSES), description: "Where the batch is in processing" },
  { id: "workflow", label: "Workflow", type: "singleSelect", tier: "more", options: toOptions(WORKFLOWS), searchPlaceholder: "Workflows" },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "more", options: toOptions(ASSIGNEES), searchPlaceholder: "Assignees" },
  { id: "source", label: "Source", type: "multiSelect", tier: "more", options: toOptions(SOURCES) },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more", searchPlaceholder: "Contains, e.g. 1004" },
];

/**
 * For previews in narrower frames: Created Date and Status up front, everything else in
 * More Filters, so the toolbar stays on one line.
 */
export const compactDemoFilterDefinitions: FilterDefinition[] = demoFilterDefinitions.map(
  (definition) =>
    definition.id === "queue" ? { ...definition, tier: "more" as const } : definition,
);
