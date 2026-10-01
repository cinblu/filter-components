// Date presets (SPEC §6.2).
//
// Presets are stored as keys ("last7d"), never as dates. They are turned into a concrete
// range only when you query, with `resolvePreset(key, now)`. That way "Last 7 days" stays
// relative: a URL shared today still means "the last 7 days" when opened next week.
//
// All ranges are in the local time zone and inclusive at both ends.

import {
  endOfDay,
  endOfMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subHours,
  subMonths,
  subYears,
} from "date-fns";

import type { DatePresetKey, DateRangeValue } from "./types";

export interface ResolvedDateRange {
  from: Date;
  to: Date;
}

// The "N ago" labels read as "since N ago": each range runs from that point up to now.
export const DATE_PRESET_LABELS: Record<DatePresetKey, string> = {
  lastDay: "1 day ago",
  last3d: "3 days ago",
  last7d: "1 week ago",
  last30d: "Last 30 days",
  last1m: "1 month ago",
  last3m: "3 months ago",
  last6m: "6 months ago",
  last1y: "1 year ago",
  lastMonth: "Last month",
  thisMonth: "This month",
};

/** Presets offered when a dateRange definition doesn't list its own (from the design). */
export const DEFAULT_DATE_PRESETS: DatePresetKey[] = [
  "lastDay",
  "last3d",
  "last7d",
  "last1m",
  "last3m",
  "last6m",
  "last1y",
];

export function isDatePresetKey(value: string): value is DatePresetKey {
  return Object.hasOwn(DATE_PRESET_LABELS, value);
}

export function resolvePreset(key: DatePresetKey, now: Date = new Date()): ResolvedDateRange {
  switch (key) {
    case "lastDay":
      // A rolling 24 hours, not "yesterday". Across a DST change this is still exactly 24h.
      return { from: subHours(now, 24), to: now };
    case "last3d":
      // Today counts as one of the days, so start 2 days back.
      return { from: startOfDay(subDays(now, 2)), to: endOfDay(now) };
    case "last7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    // Calendar-based windows: from the start of the same date N months/years ago.
    case "last1m":
      return { from: startOfDay(subMonths(now, 1)), to: endOfDay(now) };
    case "last3m":
      return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
    case "last6m":
      return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now) };
    case "last1y":
      return { from: startOfDay(subYears(now, 1)), to: endOfDay(now) };
    case "lastMonth": {
      // The whole previous calendar month. For a rolling window, use last30d.
      const previousMonth = subMonths(now, 1);
      return { from: startOfMonth(previousMonth), to: endOfMonth(previousMonth) };
    }
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfDay(now) };
  }
}

/** Resolves any date range value. Custom ranges cover whole days, both ends inclusive. */
export function resolveDateRange(value: DateRangeValue, now: Date = new Date()): ResolvedDateRange {
  if (value.kind === "preset") return resolvePreset(value.preset, now);
  // parseISO reads a plain "yyyy-MM-dd" as local midnight, which is what we want here.
  return { from: startOfDay(parseISO(value.from)), to: endOfDay(parseISO(value.to)) };
}
