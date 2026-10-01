import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createdAtDefinition, moreDefinitions, queueDefinition, statusDefinition } from "./test-utils";
import type { FilterState } from "./types";
import { parseFilterQuery, serializeFilterQuery, useFilterUrlState } from "./url-state";

const definitions = [createdAtDefinition, queueDefinition, statusDefinition, ...moreDefinitions];
const roundTrip = (state: FilterState) =>
  parseFilterQuery(serializeFilterQuery(state, definitions), definitions);

describe("[T] round-trips every value type (SPEC §11)", () => {
  it.each<[string, FilterState]>([
    ["multiSelect", { status: ["open", "closed"] }],
    ["singleSelect", { workflow: "two-step" }],
    ["text", { batchId: "B-10042" }],
    ["dateRange preset", { createdAt: { kind: "preset", preset: "last7d" } }],
    ["dateRange custom", { createdAt: { kind: "custom", from: "2026-04-18", to: "2026-04-24" } }],
    ["every type at once", {
      createdAt: { kind: "preset", preset: "lastMonth" },
      queue: ["intake"],
      workflow: "redaction",
      assignee: ["avrel", "bexa"],
      batchId: "B 7",
    }],
  ])("%s", (_, state) => {
    expect(roundTrip(state)).toEqual(state);
  });

  it("round-trips awkward characters, including commas inside values", () => {
    const state: FilterState = {
      status: ["a,b", "c d", "ü&é", "50%"],
      batchId: "x=y&z+1, ok?",
    };
    expect(roundTrip(state)).toEqual(state);
  });
});

describe("format", () => {
  it("matches the documented format", () => {
    expect(serializeFilterQuery({ status: ["open", "closed"], createdAt: { kind: "preset", preset: "last7d" } }, definitions))
      .toBe("?status=open,closed&createdAt=last7d");
    expect(serializeFilterQuery({ createdAt: { kind: "custom", from: "2026-04-18", to: "2026-04-24" } }, definitions))
      .toBe("?createdAt=2026-04-18_2026-04-24");
  });

  it("writes params in the order filters were applied", () => {
    expect(serializeFilterQuery({ workflow: "redaction", queue: ["intake"] }, definitions)).toBe(
      "?workflow=redaction&queue=intake",
    );
  });

  it("returns an empty string when nothing is set", () => {
    expect(serializeFilterQuery({}, definitions)).toBe("");
    expect(serializeFilterQuery({ status: [], batchId: "" }, definitions)).toBe("");
  });
});

describe("[T] unknown params are ignored", () => {
  it("ignores params that aren't filter ids", () => {
    expect(parseFilterQuery("?utm_source=mail&status=open&page=2", definitions)).toEqual({ status: ["open"] });
  });

  it("keeps unrelated params in place when writing", () => {
    expect(serializeFilterQuery({ status: ["closed"] }, definitions, "?page=2&status=open&tab=all")).toBe(
      "?page=2&tab=all&status=closed",
    );
  });

  it("removes cleared filters but keeps unrelated params", () => {
    expect(serializeFilterQuery({}, definitions, "?page=2&status=open")).toBe("?page=2");
  });
});

describe("malformed values are ignored", () => {
  it.each([
    ["unknown preset", "?createdAt=last8d"],
    ["bad custom range", "?createdAt=2026-04-18"],
    ["impossible date", "?createdAt=2026-02-30_2026-03-02"],
    ["too many parts", "?createdAt=2026-04-18_2026-04-19_2026-04-20"],
    ["bad percent-encoding", "?batchId=%E0%A4%A"],
    ["empty multiSelect", "?status="],
    ["empty text", "?batchId="],
  ])("%s", (_, query) => {
    expect(parseFilterQuery(query, definitions)).toEqual({});
  });

  it("swaps a backwards custom range", () => {
    expect(parseFilterQuery("?createdAt=2026-04-24_2026-04-18", definitions)).toEqual({
      createdAt: { kind: "custom", from: "2026-04-18", to: "2026-04-24" },
    });
  });

  it("drops duplicate and empty list items", () => {
    expect(parseFilterQuery("?status=open,,open,closed", definitions)).toEqual({ status: ["open", "closed"] });
  });

  it("reads + as a space", () => {
    expect(parseFilterQuery("?batchId=B+7", definitions)).toEqual({ batchId: "B 7" });
  });
});

describe("useFilterUrlState", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("reads the current URL", () => {
    window.history.replaceState(null, "", "/demo?status=open&x=1");
    const { result } = renderHook(() => useFilterUrlState(definitions));
    expect(result.current.value).toEqual({ status: ["open"] });
  });

  it("writes changes with replaceState, keeping path, other params and hash", () => {
    window.history.replaceState(null, "", "/demo?page=2#rows");
    const before = window.history.length;
    const { result } = renderHook(() => useFilterUrlState(definitions));
    act(() => result.current.onChange({ queue: ["intake", "billing"] }));
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      "/demo?page=2&queue=intake,billing#rows",
    );
    expect(window.history.length).toBe(before);
    expect(result.current.value).toEqual({ queue: ["intake", "billing"] });
  });

  it("follows back/forward navigation", () => {
    window.history.replaceState(null, "", "/demo");
    const { result } = renderHook(() => useFilterUrlState(definitions));
    act(() => {
      window.history.replaceState(null, "", "/demo?workflow=redaction");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(result.current.value).toEqual({ workflow: "redaction" });
  });
});
