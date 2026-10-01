import { describe, expect, it } from "vitest";

import { getFilterSummary, truncate } from "./summary";
import type { FilterDefinition } from "./types";

const now = new Date(2026, 3, 24, 15, 30);

const status: FilterDefinition = {
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
    expect(getFilterSummary(status, ["open"], now)).toEqual({ short: "Open", full: "Open" });
  });

  it("multiSelect with 2+ values → first label, +N", () => {
    expect(getFilterSummary(status, ["open", "pending", "closed"], now)).toEqual({
      short: "Open, +2",
      full: "Open, Pending, Closed",
    });
  });

  it("multiSelect names the first selected value in option order, however it was picked", () => {
    expect(getFilterSummary(status, ["closed", "open"], now)?.short).toBe("Open, +1");
  });

  it("singleSelect → the option label", () => {
    expect(getFilterSummary(workflow, "two-step", now)?.short).toBe("Two-step Approval");
  });

  it("dateRange preset → the preset label", () => {
    expect(getFilterSummary(createdAt, { kind: "preset", preset: "last7d" }, now)?.short).toBe(
      "Last 7 days",
    );
  });

  it("dateRange custom in the current year → no year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2026-04-18", to: "2026-04-24" }, now)
        ?.short,
    ).toBe("Apr 18 – Apr 24");
  });

  it("dateRange custom outside the current year → with the year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2025-04-18", to: "2025-04-24" }, now)
        ?.full,
    ).toBe("Apr 18, 2025 – Apr 24, 2025");
  });

  it("dateRange custom spanning into the current year → with the year", () => {
    expect(
      getFilterSummary(createdAt, { kind: "custom", from: "2025-12-29", to: "2026-01-04" }, now)
        ?.full,
    ).toBe("Dec 29, 2025 – Jan 4, 2026");
  });

  it("text → the text", () => {
    expect(getFilterSummary(batchId, "B-10042", now)?.short).toBe("B-10042");
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

describe("[T] truncation at 24 characters", () => {
  it("truncates long summaries with an ellipsis and keeps the full text", () => {
    const long = "A very long batch identifier value";
    const summary = getFilterSummary(batchId, long, now)!;
    expect(summary.short).toHaveLength(24);
    expect(summary.short.endsWith("…")).toBe(true);
    expect(summary.full).toBe(long);
  });

  it("leaves summaries of 24 characters or fewer alone", () => {
    expect(truncate("x".repeat(24))).toBe("x".repeat(24));
    expect(truncate("x".repeat(25))).toBe(`${"x".repeat(23)}…`);
  });

  it("keeps the +N visible when the first label is long", () => {
    const queues: FilterDefinition = {
      ...status,
      options: [
        { value: "a", label: "Correspondence and Vendor Invoices" },
        { value: "b", label: "Billing" },
      ],
    };
    const summary = getFilterSummary(queues, ["a", "b"], now)!;
    expect(summary.short).toMatch(/…, \+1$/);
    expect(summary.short.length).toBeLessThanOrEqual(24);
  });
});
