import { describe, expect, it } from "vitest";

import { getFilterSummary } from "./summary";
import type { FilterDefinition } from "./types";

const now = new Date(2026, 3, 24, 15, 30);

const status: FilterDefinition = {
  id: "status",
  label: "Status",
  type: "multiSelect",
  tier: "quick",
  options: [
    { value: "todo", label: "To-do" },
    { value: "pending", label: "Pending" },
    { value: "done", label: "Completed" },
  ],
};
const workflow: FilterDefinition = {
  id: "workflow",
  label: "Workflow",
  type: "singleSelect",
  tier: "more",
  options: [{ value: "two-step", label: "Two-step Approval" }],
};
const createdAt: FilterDefinition = {
  id: "createdAt",
  label: "Created Date",
  type: "dateRange",
  tier: "quick",
};
const batchId: FilterDefinition = { id: "batchId", label: "Batch ID", type: "text", tier: "more" };

describe("[T] chip summary rules (SPEC §5)", () => {
  it("multiSelect with 1 value → the option label", () => {
    expect(getFilterSummary(status, ["todo"], now)).toEqual({
      short: "To-do",
      full: "To-do",
      tooltip: "To-do",
    });
  });

  it("multiSelect with 2+ values → 'N items', with every label in the tooltip", () => {
    expect(getFilterSummary(status, ["todo", "pending", "done"], now)).toEqual({
      short: "3 items",
      full: "To-do, Pending, Completed",
      tooltip: "To-do, Pending, Completed",
    });
  });

  it("lists multiSelect values in option order, however they were picked", () => {
    expect(getFilterSummary(status, ["done", "todo"], now)?.tooltip).toBe("To-do, Completed");
  });

  it("singleSelect → the option label", () => {
    expect(getFilterSummary(workflow, "two-step", now)?.short).toBe("Two-step Approval");
  });

  it("dateRange preset → the preset label; the tooltip shows the dates it covers now", () => {
    expect(getFilterSummary(createdAt, { kind: "preset", preset: "last7d" }, now)).toEqual({
      short: "1 week ago",
      full: "1 week ago",
      tooltip: "2026-04-18 12:00 AM – 2026-04-24 11:59 PM",
    });
  });

  it("dateRange custom in the current year → no year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2026-04-18", to: "2026-04-24" }, now),
    ).toEqual({
      short: "Apr 18 – Apr 24",
      full: "Apr 18 – Apr 24",
      tooltip: "2026-04-18 – 2026-04-24",
    });
  });

  it("dateRange custom outside the current year → with the year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2025-04-18", to: "2025-04-24" }, now)
        ?.short,
    ).toBe("Apr 18, 2025 – Apr 24, 2025");
  });

  it("dateRange custom spanning into the current year → with the year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2025-12-29", to: "2026-01-04" }, now)
        ?.short,
    ).toBe("Dec 29, 2025 – Jan 4, 2026");
  });

  it("text → the text, untruncated (the chip's max width cuts it off visually)", () => {
    const long = "A very long batch identifier value that goes on";
    expect(getFilterSummary(batchId, long, now)).toEqual({ short: long, full: long, tooltip: long });
  });

  it("returns null when the value is empty", () => {
    expect(getFilterSummary(status, [], now)).toBeNull();
    expect(getFilterSummary(batchId, "", now)).toBeNull();
    expect(getFilterSummary(createdAt, undefined, now)).toBeNull();
  });

  it("falls back to the raw value for values that aren't options", () => {
    expect(getFilterSummary(status, ["archived"], now)?.short).toBe("archived");
  });
});
