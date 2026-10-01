import type { Row, RowData } from "@tanstack/react-table";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createdAtDefinition,
  moreDefinitions,
  queueDefinition,
  statusDefinition,
} from "@/registry/filter-bar/test-utils";

import { dateRangeFn, multiSelectFn, singleSelectFn, textFn, toColumnFilters } from "./adapter";

const definitions = [createdAtDefinition, queueDefinition, statusDefinition, ...moreDefinitions];

// A row stand-in: the filter functions only call getValue.
const rowWith = (value: unknown) => ({ getValue: () => value }) as unknown as Row<RowData>;
const noop = () => {};

describe("toColumnFilters", () => {
  it("maps applied filters to column filters, keyed by filter id", () => {
    expect(
      toColumnFilters(
        { status: ["open"], createdAt: { kind: "preset", preset: "last7d" }, batchId: "B-1" },
        definitions,
      ),
    ).toEqual([
      { id: "status", value: ["open"] },
      { id: "createdAt", value: { kind: "preset", preset: "last7d" } },
      { id: "batchId", value: "B-1" },
    ]);
  });

  it("skips empty values and unknown ids", () => {
    expect(toColumnFilters({ status: [], batchId: "", nope: ["x"] }, definitions)).toEqual([]);
  });
});

describe("filter functions", () => {
  it("multiSelectFn keeps rows whose value is selected", () => {
    expect(multiSelectFn(rowWith("open"), "status", ["open", "closed"], noop)).toBe(true);
    expect(multiSelectFn(rowWith("pending"), "status", ["open", "closed"], noop)).toBe(false);
  });

  it("singleSelectFn keeps rows that match exactly", () => {
    expect(singleSelectFn(rowWith("redaction"), "workflow", "redaction", noop)).toBe(true);
    expect(singleSelectFn(rowWith("redaction-2"), "workflow", "redaction", noop)).toBe(false);
  });

  it("textFn is a case-insensitive contains", () => {
    expect(textFn(rowWith("B-10042"), "batchId", "b-100", noop)).toBe(true);
    expect(textFn(rowWith("B-10042"), "batchId", "  0042 ", noop)).toBe(true);
    expect(textFn(rowWith("B-10042"), "batchId", "777", noop)).toBe(false);
  });
});

describe("dateRangeFn", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 3, 24, 15, 30));
  });
  afterEach(() => vi.useRealTimers());

  const last7d = { kind: "preset", preset: "last7d" } as const;

  it("includes both ends of the range", () => {
    expect(dateRangeFn(rowWith(new Date(2026, 3, 18, 0, 0)), "createdAt", last7d, noop)).toBe(true);
    expect(dateRangeFn(rowWith(new Date(2026, 3, 24, 23, 59, 59)), "createdAt", last7d, noop)).toBe(true);
    expect(dateRangeFn(rowWith(new Date(2026, 3, 17, 23, 59, 59)), "createdAt", last7d, noop)).toBe(false);
  });

  it("resolves presets when the filter runs, not when it was applied", () => {
    const row = rowWith(new Date(2026, 3, 18, 12).toISOString());
    expect(dateRangeFn(row, "createdAt", last7d, noop)).toBe(true);
    // A week later, the same stored filter no longer includes that day.
    vi.setSystemTime(new Date(2026, 4, 1, 9));
    expect(dateRangeFn(row, "createdAt", last7d, noop)).toBe(false);
  });

  it("treats custom ranges as whole days, inclusive", () => {
    const custom = { kind: "custom", from: "2026-04-18", to: "2026-04-20" } as const;
    expect(dateRangeFn(rowWith("2026-04-20T23:30:00"), "createdAt", custom, noop)).toBe(true);
    expect(dateRangeFn(rowWith("2026-04-21T00:00:00"), "createdAt", custom, noop)).toBe(false);
  });

  it("accepts Dates, ISO strings and timestamps; rejects missing or invalid values", () => {
    const day = new Date(2026, 3, 20, 10);
    for (const value of [day, day.toISOString(), day.getTime()]) {
      expect(dateRangeFn(rowWith(value), "createdAt", last7d, noop)).toBe(true);
    }
    for (const value of [null, undefined, "not a date"]) {
      expect(dateRangeFn(rowWith(value), "createdAt", last7d, noop)).toBe(false);
    }
  });
});
