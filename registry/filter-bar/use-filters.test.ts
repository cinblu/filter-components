import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { FilterDefinition, FilterState } from "./types";
import {
  type UseFiltersOptions,
  filterValuesEqual,
  isEmptyValue,
  useFilters,
} from "./use-filters";

const definitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick" },
  {
    id: "queue",
    label: "Queue",
    type: "multiSelect",
    tier: "quick",
    options: [
      { value: "intake", label: "Intake" },
      { value: "billing", label: "Billing" },
      { value: "claims", label: "Claims" },
    ],
  },
  {
    id: "status",
    label: "Status",
    type: "multiSelect",
    tier: "quick",
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "workflow", label: "Workflow", type: "singleSelect", tier: "more", options: [] },
  { id: "assignee", label: "Assignee", type: "multiSelect", tier: "more", options: [] },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more" },
];

function setup(options: Partial<UseFiltersOptions> = {}) {
  const onChange = vi.fn();
  const hook = renderHook(() => useFilters({ definitions, onChange, ...options }));
  return { ...hook, onChange };
}

describe("value helpers", () => {
  it("treats undefined, empty string and empty array as not set", () => {
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue([])).toBe(true);
    expect(isEmptyValue("x")).toBe(false);
    expect(isEmptyValue(["x"])).toBe(false);
    expect(isEmptyValue({ kind: "preset", preset: "last7d" })).toBe(false);
  });

  it("compares arrays ignoring order, and all empty values as equal", () => {
    expect(filterValuesEqual(["a", "b"], ["b", "a"])).toBe(true);
    expect(filterValuesEqual(["a", "b"], ["a"])).toBe(false);
    expect(filterValuesEqual([], undefined)).toBe(true);
    expect(filterValuesEqual("", [])).toBe(true);
    expect(filterValuesEqual("a", ["a"])).toBe(false);
    expect(
      filterValuesEqual({ kind: "preset", preset: "last7d" }, { kind: "preset", preset: "last7d" }),
    ).toBe(true);
    expect(
      filterValuesEqual(
        { kind: "custom", from: "2026-04-18", to: "2026-04-24" },
        { kind: "custom", from: "2026-04-18", to: "2026-04-25" },
      ),
    ).toBe(false);
    expect(
      filterValuesEqual({ kind: "preset", preset: "last7d" }, { kind: "custom", from: "", to: "" }),
    ).toBe(false);
  });
});

describe("[T] applied state changes only through apply, clear, clearAll, or instant setPending", () => {
  it("setPending in manual mode does not change applied", () => {
    const { result, onChange } = setup();
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    expect(result.current.applied).toEqual({});
    expect(result.current.openEditor("queue").pending).toEqual(["intake"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reset and discard do not change applied", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").reset());
    expect(result.current.applied).toEqual({ queue: ["intake"] });
    act(() => result.current.openEditor("queue").discard());
    expect(result.current.applied).toEqual({ queue: ["intake"] });
  });

  it("apply changes applied", () => {
    const { result } = setup();
    act(() => result.current.openEditor("queue").setPending(["intake", "billing"]));
    act(() => result.current.openEditor("queue").apply());
    expect(result.current.applied).toEqual({ queue: ["intake", "billing"] });
  });

  it("apply uses a pending value set earlier in the same event", () => {
    const { result } = setup();
    act(() => {
      const editor = result.current.openEditor("workflow");
      editor.setPending("auto");
      editor.apply();
    });
    expect(result.current.applied).toEqual({ workflow: "auto" });
  });

  it("clear removes one filter immediately, without apply", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"], status: ["open"] } });
    act(() => result.current.clear("queue"));
    expect(result.current.applied).toEqual({ status: ["open"] });
  });

  it("clear also drops that filter's pending edit", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").setPending(["billing"]));
    act(() => result.current.clear("queue"));
    expect(result.current.openEditor("queue").pending).toBeUndefined();
  });

  it("clearAll removes every filter and every pending edit", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"], batchId: "B-1" } });
    act(() => result.current.openEditor("status").setPending(["open"]));
    act(() => result.current.clearAll());
    expect(result.current.applied).toEqual({});
    expect(result.current.openEditor("status").pending).toBeUndefined();
  });

  it("two clears in the same event both take effect", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"], status: ["open"] } });
    act(() => {
      result.current.clear("queue");
      result.current.clear("status");
    });
    expect(result.current.applied).toEqual({});
  });

  it("setPending in instant mode applies immediately", () => {
    const { result, onChange } = setup({ applyMode: "instant" });
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    expect(result.current.applied).toEqual({ queue: ["intake"] });
    expect(onChange).toHaveBeenCalledWith({ queue: ["intake"] });
    // Nothing is left pending, so there is nothing to apply.
    expect(result.current.openEditor("queue").canApply).toBe(false);
  });
});

describe("[T] canApply is false when pending equals applied", () => {
  it("is false before any edit", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    expect(result.current.openEditor("queue").canApply).toBe(false);
    expect(result.current.openEditor("status").canApply).toBe(false);
  });

  it("is true after a real change, false again when changed back", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").setPending(["intake", "billing"]));
    expect(result.current.openEditor("queue").canApply).toBe(true);
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    expect(result.current.openEditor("queue").canApply).toBe(false);
  });

  it("ignores array order", () => {
    const { result } = setup({ defaultValue: { queue: ["intake", "billing"] } });
    act(() => result.current.openEditor("queue").setPending(["billing", "intake"]));
    expect(result.current.openEditor("queue").canApply).toBe(false);
  });

  it("compares date ranges and strings by value", () => {
    const { result } = setup({
      defaultValue: { createdAt: { kind: "preset", preset: "last7d" }, batchId: "B-1" },
    });
    act(() => {
      result.current.openEditor("createdAt").setPending({ kind: "preset", preset: "last7d" });
      result.current.openEditor("batchId").setPending("B-1");
    });
    expect(result.current.openEditor("createdAt").canApply).toBe(false);
    expect(result.current.openEditor("batchId").canApply).toBe(false);

    act(() => result.current.openEditor("createdAt").setPending({ kind: "preset", preset: "last30d" }));
    expect(result.current.openEditor("createdAt").canApply).toBe(true);
  });

  it("is true when reset would remove an applied filter", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").reset());
    expect(result.current.openEditor("queue").pending).toBeUndefined();
    expect(result.current.openEditor("queue").canApply).toBe(true);
  });

  it("is false when an unset filter is edited to empty", () => {
    const { result } = setup();
    act(() => result.current.openEditor("queue").setPending([]));
    expect(result.current.openEditor("queue").canApply).toBe(false);
  });
});

describe("[T] empty values count as not set; applying one removes the filter", () => {
  it.each([
    ["empty array", "queue", []],
    ["empty string", "batchId", ""],
    ["undefined", "status", undefined],
  ] as const)("%s is not active", (_, id, value) => {
    const { result } = setup({ defaultValue: { [id]: value } as FilterState });
    expect(result.current.isActive(id)).toBe(false);
    expect(result.current.applied).toEqual({});
    expect(result.current.activeCount).toBe(0);
  });

  it("applying an empty array removes the filter", () => {
    const { result, onChange } = setup({ defaultValue: { queue: ["intake"], status: ["open"] } });
    act(() => result.current.openEditor("queue").setPending([]));
    act(() => result.current.openEditor("queue").apply());
    expect(result.current.applied).toEqual({ status: ["open"] });
    expect("queue" in result.current.applied).toBe(false);
    expect(onChange).toHaveBeenCalledWith({ status: ["open"] });
  });

  it("applying an empty string removes a text filter", () => {
    const { result } = setup({ defaultValue: { batchId: "B-1" } });
    act(() => result.current.openEditor("batchId").setPending(""));
    act(() => result.current.openEditor("batchId").apply());
    expect(result.current.applied).toEqual({});
  });

  it("reset then apply removes the filter", () => {
    const { result } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").reset());
    act(() => result.current.openEditor("queue").apply());
    expect(result.current.isActive("queue")).toBe(false);
  });

  it("instant mode: toggling the last option off removes the filter", () => {
    const { result } = setup({ applyMode: "instant", defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").setPending([]));
    expect(result.current.applied).toEqual({});
  });
});

describe("[T] discard throws away pending changes", () => {
  it("restores pending to the applied value and leaves applied alone", () => {
    const { result, onChange } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").setPending(["billing", "claims"]));
    act(() => result.current.openEditor("queue").discard());
    const editor = result.current.openEditor("queue");
    expect(editor.pending).toEqual(["intake"]);
    expect(editor.canApply).toBe(false);
    expect(result.current.applied).toEqual({ queue: ["intake"] });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("only discards the filter it belongs to", () => {
    const { result } = setup();
    act(() => {
      result.current.openEditor("queue").setPending(["intake"]);
      result.current.openEditor("status").setPending(["open"]);
    });
    act(() => result.current.openEditor("queue").discard());
    expect(result.current.openEditor("queue").pending).toBeUndefined();
    expect(result.current.openEditor("status").pending).toEqual(["open"]);
  });
});

describe("[T] onChange fires once per applied change, never for pending edits", () => {
  it("fires once on apply, with the full new state", () => {
    const { result, onChange } = setup({ defaultValue: { status: ["open"] } });
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    act(() => result.current.openEditor("queue").setPending(["intake", "billing"]));
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.openEditor("queue").apply());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ status: ["open"], queue: ["intake", "billing"] });
  });

  it("does not fire for reset or discard", () => {
    const { result, onChange } = setup({ defaultValue: { queue: ["intake"] } });
    act(() => result.current.openEditor("queue").reset());
    act(() => result.current.openEditor("queue").discard());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire when apply changes nothing", () => {
    const { result, onChange } = setup({ defaultValue: { queue: ["intake", "billing"] } });
    act(() => result.current.openEditor("queue").setPending(["billing", "intake"]));
    act(() => result.current.openEditor("queue").apply());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire when clearing a filter that isn't set, or clearing all when nothing is set", () => {
    const { result, onChange } = setup();
    act(() => result.current.clear("queue"));
    act(() => result.current.clearAll());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fires once for clear and once for clearAll", () => {
    const { result, onChange } = setup({ defaultValue: { queue: ["intake"], status: ["open"] } });
    act(() => result.current.clear("queue"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ status: ["open"] });
    act(() => result.current.clearAll());
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("fires once per toggle in instant mode", () => {
    const { result, onChange } = setup({ applyMode: "instant" });
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    act(() => result.current.openEditor("queue").setPending(["intake", "billing"]));
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("controlled mode", () => {
  it("reads applied from value and reports changes through onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => {
      const [value, setValue] = useState<FilterState>({ queue: ["intake"] });
      const filters = useFilters({
        definitions,
        value,
        onChange: (next) => {
          onChange(next);
          setValue(next);
        },
      });
      return { filters, setValue };
    });

    act(() => result.current.filters.openEditor("status").setPending(["open"]));
    act(() => result.current.filters.openEditor("status").apply());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(result.current.filters.applied).toEqual({ queue: ["intake"], status: ["open"] });

    // External changes (e.g. from the URL) flow straight in, without onChange.
    act(() => result.current.setValue({ batchId: "B-7" }));
    expect(result.current.filters.applied).toEqual({ batchId: "B-7" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("keeps showing the passed value if the parent ignores a change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useFilters({ definitions, value: { queue: ["intake"] }, onChange }),
    );
    act(() => result.current.clear("queue"));
    expect(onChange).toHaveBeenCalledWith({});
    expect(result.current.applied).toEqual({ queue: ["intake"] });
  });
});

describe("tiers and derived values", () => {
  it("splits definitions into quick and more tiers, in definition order", () => {
    const { result } = setup();
    expect(result.current.quickFilters.map((d) => d.id)).toEqual(["createdAt", "queue", "status"]);
    expect(result.current.moreFilters.map((d) => d.id)).toEqual(["workflow", "assignee", "batchId"]);
  });

  it("lists active more-tier filters in the order they were applied", () => {
    const { result } = setup();
    act(() => result.current.openEditor("batchId").setPending("B-1"));
    act(() => result.current.openEditor("batchId").apply());
    act(() => result.current.openEditor("queue").setPending(["intake"]));
    act(() => result.current.openEditor("queue").apply());
    act(() => result.current.openEditor("workflow").setPending("auto"));
    act(() => result.current.openEditor("workflow").apply());

    expect(result.current.activeMoreFilters.map((d) => d.id)).toEqual(["batchId", "workflow"]);
    expect(result.current.activeCount).toBe(3);

    // Re-applying an existing filter keeps its position, so its chip doesn't move.
    act(() => result.current.openEditor("batchId").setPending("B-2"));
    act(() => result.current.openEditor("batchId").apply());
    expect(result.current.activeMoreFilters.map((d) => d.id)).toEqual(["batchId", "workflow"]);
  });

  it("drops cleared more-tier filters from the active list", () => {
    const { result } = setup({ defaultValue: { workflow: "auto", assignee: ["avrel"] } });
    act(() => result.current.clear("workflow"));
    expect(result.current.activeMoreFilters.map((d) => d.id)).toEqual(["assignee"]);
  });

  it("ignores values for ids that have no definition", () => {
    const { result } = setup({ defaultValue: { unknown: ["x"], queue: ["intake"] } });
    expect(result.current.applied).toEqual({ queue: ["intake"] });
    expect(result.current.activeCount).toBe(1);
  });

  it("stores date presets as keys, not dates", () => {
    const { result } = setup();
    act(() => result.current.openEditor("createdAt").setPending({ kind: "preset", preset: "last7d" }));
    act(() => result.current.openEditor("createdAt").apply());
    expect(result.current.applied.createdAt).toEqual({ kind: "preset", preset: "last7d" });
  });

  it("throws for an unknown filter id", () => {
    const { result } = setup();
    expect(() => result.current.openEditor("nope")).toThrow(/unknown filter id "nope"/);
  });
});
