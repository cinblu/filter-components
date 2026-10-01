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
} from "date-fns";

import type { DatePresetKey, DateRangeValue } from "./types";

export interface ResolvedDateRange {
  from: Date;
  to: Date;
}

export const DATE_PRESET_LABELS: Record<DatePresetKey, string> = {
  lastDay: "Last day",
  last7d: "Last 7 days",
  last30d: "Last 30 days",
  lastMonth: "Last month",
  thisMonth: "This month",
};

/** Presets offered when a dateRange definition doesn't list its own. */
export const DEFAULT_DATE_PRESETS: DatePresetKey[] = ["lastDay", "last7d", "last30d", "lastMonth"];

export function isDatePresetKey(value: string): value is DatePresetKey {
  return Object.hasOwn(DATE_PRESET_LABELS, value);
}

export function resolvePreset(key: DatePresetKey, now: Date = new Date()): ResolvedDateRange {
  switch (key) {
    case "lastDay":
      // A rolling 24 hours, not "yesterday". Across a DST change this is still exactly 24h.
      return { from: subHours(now, 24), to: now };
    case "last7d":
      // Today counts as one of the 7 days, so start 6 days back.
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
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
