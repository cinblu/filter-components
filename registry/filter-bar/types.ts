// Types for filter definitions, values and sort state (SPEC §2).

import type { ReactNode } from "react";

export type FilterType = "multiSelect" | "singleSelect" | "dateRange" | "text";

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface FilterDefinition {
  /** Unique id. Also used as the URL param key. */
  id: string;
  /** Human-readable label, e.g. "Created Date". */
  label: string;
  type: FilterType;
  /** "quick" filters are always visible; "more" filters live in the More Filters menu. */
  tier: "quick" | "more";
  /** Context tooltip on the unset chip, e.g. "When the batch was created". */
  description?: string;
  /** Options for the select types. Can be loaded lazily. */
  options?: FilterOption[] | (() => Promise<FilterOption[]>);
  /** Show a search input in the editor. Defaults to true when there are more than 7 options. */
  searchable?: boolean;
  /** Placeholder for the editor's search input. Defaults to the label, e.g. "Queues". */
  searchPlaceholder?: string;
  /** dateRange only: which presets to offer. */
  presets?: DatePresetKey[];
  /** dateRange only: offer "Custom range…". Defaults to true. */
  allowCustomRange?: boolean;
}

export type DatePresetKey =
  | "lastDay"
  | "last3d"
  | "last7d"
  | "last30d"
  | "last1m"
  | "last3m"
  | "last6m"
  | "last1y"
  | "lastMonth"
  | "thisMonth";

export type DateRangeValue =
  | { kind: "preset"; preset: DatePresetKey }
  /** ISO dates (yyyy-MM-dd), both ends inclusive. */
  | { kind: "custom"; from: string; to: string };

/** multiSelect → string[], singleSelect and text → string, dateRange → DateRangeValue. */
export type FilterValue = string[] | string | DateRangeValue;

/** Applied filters keyed by definition id. A missing or empty value means "not set". */
export type FilterState = Record<string, FilterValue | undefined>;

export interface SortState {
  columnId: string;
  label: string;
  direction: "asc" | "desc";
  /** Words for each direction, e.g. { asc: "Oldest first", desc: "Newest first" }. */
  directionLabels?: { asc: string; desc: string };
}
