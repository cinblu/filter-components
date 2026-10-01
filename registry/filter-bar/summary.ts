// What a set chip says (SPEC §5): "Status  3 items", "Created Date  1 week ago".
// Also used by the More Filters menu, and for the chip's hover tooltip.

import { format, parseISO } from "date-fns";

import { getLoadedOptions, getOptionLabel } from "./options";
import { DATE_PRESET_LABELS, resolvePreset } from "./presets";
import type { DateRangeValue, FilterDefinition, FilterValue } from "./types";
import { isEmptyValue } from "./use-filters";

export interface FilterSummary {
  /** The value shown on the chip. Long values are cut off by the chip's max width (CSS). */
  short: string;
  /** Everything, for the aria-label. */
  full: string;
  /** Tooltip text: the full value, or for date presets the dates they cover right now. */
  tooltip: string;
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

/** The exact span a date value covers, e.g. "2026-04-18 12:00 AM – 2026-04-24 11:59 PM". */
export function formatDateRangeDetail(value: DateRangeValue, now: Date = new Date()): string {
  const pattern = "yyyy-MM-dd h:mm a";
  if (value.kind === "custom") {
    return `${format(parseISO(value.from), "yyyy-MM-dd")} – ${format(parseISO(value.to), "yyyy-MM-dd")}`;
  }
  const { from, to } = resolvePreset(value.preset, now);
  return `${format(from, pattern)} – ${format(to, pattern)}`;
}

/** Selected values in option order, so the list reads the same however it was picked. */
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

  if (Array.isArray(value)) {
    const labels = selectedLabels(definition, value);
    const full = labels.join(", ");
    // One value reads as itself; more than one becomes a count, listed in the tooltip.
    const short = labels.length === 1 ? labels[0] : `${labels.length} items`;
    return { short, full, tooltip: full };
  }
  if (typeof value === "string") {
    const full = definition.type === "singleSelect" ? getOptionLabel(definition, value) : value;
    return { short: full, full, tooltip: full };
  }
  const short = formatDateRange(value, now);
  const detail = formatDateRangeDetail(value, now);
  return { short, full: short, tooltip: detail };
}
