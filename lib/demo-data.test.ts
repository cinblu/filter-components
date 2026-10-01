import { subMonths } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  ASSIGNEES,
  DEMO_ROW_COUNT,
  QUEUES,
  SOURCES,
  STATUSES,
  WORKFLOWS,
  generateDemoRows,
} from "./demo-data";

const now = new Date(2026, 3, 24); // fixed reference: 24 Apr 2026, local time

describe("generateDemoRows", () => {
  it("is deterministic for a given seed and reference date", () => {
    expect(generateDemoRows({ now })).toEqual(generateDemoRows({ now }));
  });

  it("produces different data for a different seed", () => {
    expect(generateDemoRows({ now, seed: 1 })).not.toEqual(generateDemoRows({ now, seed: 2 }));
  });

  it("generates the documented shape", () => {
    const rows = generateDemoRows({ now });
    expect(rows).toHaveLength(DEMO_ROW_COUNT);
    expect(QUEUES).toHaveLength(12);
    expect(new Set(rows.map((r) => r.batchId)).size).toBe(rows.length);

    const earliest = subMonths(now, 18).getTime();
    for (const row of rows) {
      expect(QUEUES).toContain(row.queue);
      expect(WORKFLOWS).toContain(row.workflow);
      expect(STATUSES).toContain(row.status);
      expect(ASSIGNEES).toContain(row.assignee);
      expect(SOURCES).toContain(row.source);
      expect(row.pages).toBeGreaterThanOrEqual(1);
      expect(row.pages).toBeLessThanOrEqual(400);
      const created = new Date(row.createdAt).getTime();
      expect(created).toBeGreaterThanOrEqual(earliest);
      expect(created).toBeLessThanOrEqual(now.getTime());
    }
  });

  it("uses every option value, so every filter option has matches", () => {
    const rows = generateDemoRows({ now });
    for (const [values, key] of [
      [QUEUES, "queue"],
      [WORKFLOWS, "workflow"],
      [STATUSES, "status"],
      [ASSIGNEES, "assignee"],
      [SOURCES, "source"],
    ] as const) {
      expect(new Set(rows.map((r) => r[key]))).toEqual(new Set(values));
    }
  });

  it("contains no personal-data-like fields", () => {
    const keys = Object.keys(generateDemoRows({ now, count: 1 })[0]);
    expect(keys.sort()).toEqual(
      ["assignee", "batchId", "createdAt", "pages", "queue", "source", "status", "workflow"].sort(),
    );
  });
});
