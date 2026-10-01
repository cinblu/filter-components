// Text shown on a set chip (SPEC §5): "Status: Open, +2", "Created Date: Last 7 days".
// Also used by the More Filters menu to show what an applied filter is set to.

import { format, parseISO } from "date-fns";

import { getLoadedOptions, getOptionLabel } from "./options";
import { DATE_PRESET_LABELS } from "./presets";
import type { DateRangeValue, FilterDefinition, FilterValue } from "./types";
import { isEmptyValue } from "./use-filters";

export const SUMMARY_MAX_LENGTH = 24;

export interface FilterSummary {
  /** Short text for the chip, at most SUMMARY_MAX_LENGTH characters. */
  short: string;
  /** Everything, for the title attribute and the aria-label. */
  full: string;
}

/** Cuts text to `max` characters, ending in an ellipsis when it was cut. */
export function truncate(text: string, max = SUMMARY_MAX_LENGTH): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** "Apr 18 – Apr 24". The year is added only when the range isn't within the current year. */
export function formatDateRange(value: DateRangeValue, now: Date = new Date()): string {
  if (value.kind === "preset") return DATE_PRESET_LABELS[value.preset];
  const from = parseISO(value.from);
  const to = parseISO(value.to);
  const thisYear = now.getFullYear();
  const pattern =
    from.getFullYear() === thisYear && to.getFullYear() === thisYear ? "MMM d" : "MMM d, yyyy";
  return `${format(from, pattern)} – ${format(to, pattern)}`;
}

/** Selected values in option order, so "Open, +2" names the same first item however it was picked. */
function selectedLabels(definition: FilterDefinition, values: string[]): string[] {
  const options = getLoadedOptions(definition) ?? [];
  const position = new Map(options.map((o, i) => [o.value, i]));
  return [...values]
    .sort((a, b) => (position.get(a) ?? Infinity) - (position.get(b) ?? Infinity))
    .map((v) => getOptionLabel(definition, v));
}

export function getFilterSummary(
  definition: FilterDefinition,
  value: FilterValue | undefined,
  now: Date = new Date(),
): FilterSummary | null {
  if (isEmptyValue(value)) return null;

  let short: string;
  let full: string;
  if (Array.isArray(value)) {
    const labels = selectedLabels(definition, value);
    full = labels.join(", ");
    if (labels.length === 1) {
      short = labels[0];
    } else {
      // Truncate the first label rather than the whole text, so the "+2" is never cut off.
      const rest = `, +${labels.length - 1}`;
      short = truncate(labels[0], SUMMARY_MAX_LENGTH - rest.length) + rest;
    }
  } else if (typeof value === "string") {
    full = definition.type === "singleSelect" ? getOptionLabel(definition, value) : value;
    short = full;
  } else {
    full = formatDateRange(value, now);
    short = full;
  }
  return { short: truncate(short), full };
}
