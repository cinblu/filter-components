import { describe, expect, it } from "vitest";

import {
  DATE_PRESET_LABELS,
  DEFAULT_DATE_PRESETS,
  isDatePresetKey,
  resolveDateRange,
  resolvePreset,
} from "./presets";

// Local-time constructor: month is 1-based here to keep the tests readable.
const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0, ms = 0) =>
  new Date(y, m - 1, d, h, min, s, ms);
const endOf = (y: number, m: number, d: number) => at(y, m, d, 23, 59, 59, 999);

// Fixed "now": Friday 24 April 2026, 15:30 local time.
const now = at(2026, 4, 24, 15, 30);

describe("test environment", () => {
  it("runs in a fixed time zone with DST (Europe/London)", () => {
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("Europe/London");
    expect(at(2026, 1, 15).getTimezoneOffset()).toBe(0); // GMT
    expect(at(2026, 7, 15).getTimezoneOffset()).toBe(-60); // BST
  });
});

describe("resolvePreset — SPEC §6.2 definitions", () => {
  it("lastDay = now − 24h → now", () => {
    expect(resolvePreset("lastDay", now)).toEqual({ from: at(2026, 4, 23, 15, 30), to: now });
  });

  it("last7d = start of day 6 days ago → end of today", () => {
    expect(resolvePreset("last7d", now)).toEqual({ from: at(2026, 4, 18), to: endOf(2026, 4, 24) });
  });

  it("last30d = start of day 29 days ago → end of today", () => {
    expect(resolvePreset("last30d", now)).toEqual({
      from: at(2026, 3, 26),
      to: endOf(2026, 4, 24),
    });
  });

  it("lastMonth = the whole previous calendar month", () => {
    expect(resolvePreset("lastMonth", now)).toEqual({
      from: at(2026, 3, 1),
      to: endOf(2026, 3, 31),
    });
  });

  it("last3d = start of day 2 days ago → end of today", () => {
    expect(resolvePreset("last3d", now)).toEqual({ from: at(2026, 4, 22), to: endOf(2026, 4, 24) });
  });

  it("last1m / last3m / last6m = start of the same date 1/3/6 months ago → end of today", () => {
    expect(resolvePreset("last1m", now)).toEqual({ from: at(2026, 3, 24), to: endOf(2026, 4, 24) });
    expect(resolvePreset("last3m", now)).toEqual({ from: at(2026, 1, 24), to: endOf(2026, 4, 24) });
    expect(resolvePreset("last6m", now)).toEqual({ from: at(2025, 10, 24), to: endOf(2026, 4, 24) });
  });

  it("last1y = start of the same date last year → end of today", () => {
    expect(resolvePreset("last1y", now)).toEqual({ from: at(2025, 4, 24), to: endOf(2026, 4, 24) });
  });

  it("last1m on the 31st clamps to the end of a shorter month", () => {
    expect(resolvePreset("last1m", at(2026, 3, 31, 9)).from).toEqual(at(2026, 2, 28));
  });

  it("thisMonth = start of this month → end of today", () => {
    expect(resolvePreset("thisMonth", now)).toEqual({
      from: at(2026, 4, 1),
      to: endOf(2026, 4, 24),
    });
  });
});

describe("resolvePreset — boundaries", () => {
  it("includes the first and last millisecond of the range (inclusive)", () => {
    const { from, to } = resolvePreset("last7d", now);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(from.getMilliseconds()).toBe(0);
    expect(to.getHours()).toBe(23);
    expect(to.getMilliseconds()).toBe(999);
  });

  it("last7d covers exactly 7 calendar days, including today", () => {
    const { from, to } = resolvePreset("last7d", at(2026, 4, 24, 0, 0));
    expect(from).toEqual(at(2026, 4, 18));
    expect(to).toEqual(endOf(2026, 4, 24));
  });

  it("lastMonth in January is December of the previous year", () => {
    expect(resolvePreset("lastMonth", at(2026, 1, 10, 9))).toEqual({
      from: at(2025, 12, 1),
      to: endOf(2025, 12, 31),
    });
  });

  it("lastMonth handles February in a leap year", () => {
    expect(resolvePreset("lastMonth", at(2024, 3, 31, 12))).toEqual({
      from: at(2024, 2, 1),
      to: endOf(2024, 2, 29),
    });
  });

  it("lastMonth on the 31st doesn't skip a short month", () => {
    // 31 March → previous month is February, not "3 March" or January.
    expect(resolvePreset("lastMonth", at(2026, 3, 31, 12)).from).toEqual(at(2026, 2, 1));
  });

  it("thisMonth on the 1st is just today", () => {
    expect(resolvePreset("thisMonth", at(2026, 5, 1, 8))).toEqual({
      from: at(2026, 5, 1),
      to: endOf(2026, 5, 1),
    });
  });

  it("last30d crosses a year boundary", () => {
    expect(resolvePreset("last30d", at(2026, 1, 5, 10)).from).toEqual(at(2025, 12, 7));
  });

  it("lastDay is exactly 24 hours across a DST change (clocks go forward 29 Mar 2026)", () => {
    const afterChange = at(2026, 3, 29, 12, 0); // 12:00 BST
    const { from, to } = resolvePreset("lastDay", afterChange);
    expect(to.getTime() - from.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(from).toEqual(at(2026, 3, 28, 11, 0)); // 11:00 GMT the day before
  });

  it("last7d starts at local midnight even when the range spans a DST change", () => {
    const { from } = resolvePreset("last7d", at(2026, 4, 1, 9));
    expect(from).toEqual(at(2026, 3, 26)); // still 00:00, in GMT
    expect(from.getHours()).toBe(0);
  });
});

describe("presets are relative", () => {
  it("the same preset key resolves to different dates for a different now", () => {
    const today = resolvePreset("last7d", now);
    const nextWeek = resolvePreset("last7d", at(2026, 5, 1, 15, 30));
    expect(nextWeek.from).toEqual(at(2026, 4, 25));
    expect(nextWeek.from).not.toEqual(today.from);
  });

  it("resolveDateRange resolves preset values at call time", () => {
    expect(resolveDateRange({ kind: "preset", preset: "last7d" }, now)).toEqual(
      resolvePreset("last7d", now),
    );
  });

  it("resolveDateRange treats custom ISO dates as whole local days, inclusive", () => {
    expect(resolveDateRange({ kind: "custom", from: "2026-04-18", to: "2026-04-24" }, now)).toEqual(
      { from: at(2026, 4, 18), to: endOf(2026, 4, 24) },
    );
  });
});

describe("preset metadata", () => {
  it("has a label for every preset key", () => {
    expect(DATE_PRESET_LABELS).toEqual({
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
    });
  });

  it("defaults to the design's list: 1 day, 3 days, 1 week, 1/3/6 months, 1 year ago", () => {
    expect(DEFAULT_DATE_PRESETS).toEqual(["lastDay", "last3d", "last7d", "last1m", "last3m", "last6m", "last1y"]);
  });

  it("isDatePresetKey accepts only known keys", () => {
    expect(isDatePresetKey("last7d")).toBe(true);
    expect(isDatePresetKey("last8d")).toBe(false);
    expect(isDatePresetKey("toString")).toBe(false);
  });
});
