// Headless filter state (SPEC §3).
//
// Two kinds of state live here:
// - applied: the filters the data is actually filtered by. It changes only through
//   apply(), clear(), clearAll(), or setPending() in "instant" mode.
// - pending: the edit in progress inside an editor, before the user presses Apply. It is
//   kept per filter id and thrown away by discard().
//
// The hook holds no UI state (which popover is open, focus, etc.). Editors decide when
// they open and close; they call discard() when they close without applying.

"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { FilterDefinition, FilterState, FilterValue } from "./types";

export type ApplyMode = "manual" | "instant";

export interface UseFiltersOptions {
  definitions: FilterDefinition[];
  /** "manual" (default): edits wait for Apply. "instant": every edit applies straight away. */
  applyMode?: ApplyMode;
  /** Controlled applied state. When set, the hook reads from this and never stores its own. */
  value?: FilterState;
  /** Initial applied state when uncontrolled. */
  defaultValue?: FilterState;
  /** Called once per applied change, with the full new state. Never called for pending edits. */
  onChange?: (value: FilterState) => void;
}

export interface FilterEditor {
  /** The value being edited. Starts as the applied value. */
  pending: FilterValue | undefined;
  /** Update the pending value. In "instant" mode this applies it immediately. */
  setPending: (value: FilterValue | undefined) => void;
  /** Make the pending value the applied value. Applying an empty value removes the filter. */
  apply: () => void;
  /** Clear the pending value (it is not applied until apply()). */
  reset: () => void;
  /** False when pending equals applied, so there is nothing to apply. */
  canApply: boolean;
  /** Throw away the pending value. The applied value is untouched. */
  discard: () => void;
}

export interface UseFiltersResult {
  definitions: FilterDefinition[];
  applyMode: ApplyMode;
  /** Applied filters. Only set (non-empty) values, keyed by id, in the order they were applied. */
  applied: FilterState;
  isActive: (id: string) => boolean;
  /** Remove one applied filter immediately. */
  clear: (id: string) => void;
  /** Remove every applied filter. */
  clearAll: () => void;
  /** Get the editor handle for a filter. Has no side effects, so it is safe to call in render. */
  openEditor: (id: string) => FilterEditor;
  /** Quick-tier definitions, always shown in the toolbar. */
  quickFilters: FilterDefinition[];
  /** More-tier definitions, listed in the More Filters menu. */
  moreFilters: FilterDefinition[];
  /** More-tier definitions that are applied, shown as chips. In the order they were applied. */
  activeMoreFilters: FilterDefinition[];
  /** Number of applied filters across both tiers. */
  activeCount: number;
}

/** An empty array, an empty string or undefined all mean "not set". */
export function isEmptyValue(value: FilterValue | undefined): value is undefined | "" | [] {
  if (value === undefined) return true;
  if (typeof value === "string") return value === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Compares two filter values. Arrays are compared ignoring order; all empty values are equal. */
export function filterValuesEqual(a: FilterValue | undefined, b: FilterValue | undefined): boolean {
  if (isEmptyValue(a) || isEmptyValue(b)) return isEmptyValue(a) && isEmptyValue(b);
  if (typeof a === "string" || typeof b === "string") return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    const setA = new Set(a);
    const setB = new Set(b);
    return setA.size === setB.size && [...setA].every((v) => setB.has(v));
  }
  if (a.kind === "preset" && b.kind === "preset") return a.preset === b.preset;
  if (a.kind === "custom" && b.kind === "custom") return a.from === b.from && a.to === b.to;
  return false;
}

/** Keeps only known ids with non-empty values, preserving key order. */
function normalize(state: FilterState | undefined, knownIds: Set<string>): FilterState {
  const result: FilterState = {};
  for (const [id, value] of Object.entries(state ?? {})) {
    if (knownIds.has(id) && !isEmptyValue(value)) result[id] = value;
  }
  return result;
}

function statesEqual(a: FilterState, b: FilterState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((id) => filterValuesEqual(a[id], b[id]));
}

// Pending values are wrapped so we can tell "no edit in progress" (no entry) apart from
// "edited to empty" (an entry whose value is undefined).
type PendingState = Record<string, { value: FilterValue | undefined }>;

export function useFilters({
  definitions,
  applyMode = "manual",
  value,
  defaultValue,
  onChange,
}: UseFiltersOptions): UseFiltersResult {
  const knownIds = useMemo(() => new Set(definitions.map((d) => d.id)), [definitions]);

  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<FilterState>(() =>
    normalize(defaultValue, knownIds),
  );
  const applied = useMemo(
    () => (isControlled ? normalize(value, knownIds) : uncontrolled),
    [isControlled, value, knownIds, uncontrolled],
  );

  // The latest applied state, updated synchronously on every commit. Without it, two
  // commits in the same event (e.g. clear("a"); clear("b")) would both start from the same
  // stale render and the first change would be lost.
  const appliedRef = useRef(applied);

  // Pending edits are kept in state (to re-render editors) and mirrored in a ref, for the
  // same reason as appliedRef: setPending() followed by apply() in one event must apply the
  // new value, not the one from the last render.
  const [pending, setPendingState] = useState<PendingState>({});
  const pendingRef = useRef(pending);

  const updatePending = useCallback((update: (prev: PendingState) => PendingState) => {
    const next = update(pendingRef.current);
    if (next === pendingRef.current) return;
    pendingRef.current = next;
    setPendingState(next);
  }, []);

  const onChangeRef = useRef(onChange);

  // Sync the refs after every render (refs can't be written during render). Layout effects
  // run before the browser handles the next event, so handlers always see fresh values.
  // No dependency array on purpose: in controlled mode the parent may ignore a change, and
  // appliedRef must then fall back to the value it actually passed in.
  useLayoutEffect(() => {
    appliedRef.current = applied;
    onChangeRef.current = onChange;
  });

  // The single place where applied state changes. Skips no-op changes so onChange only
  // fires when something actually changed.
  const commit = useCallback(
    (next: FilterState) => {
      const normalized = normalize(next, knownIds);
      if (statesEqual(normalized, appliedRef.current)) return;
      appliedRef.current = normalized;
      if (!isControlled) setUncontrolled(normalized);
      onChangeRef.current?.(normalized);
    },
    [isControlled, knownIds],
  );

  const dropPending = useCallback(
    (id: string) => {
      updatePending((prev) => {
        if (!(id in prev)) return prev;
        const rest = { ...prev };
        delete rest[id];
        return rest;
      });
    },
    [updatePending],
  );

  const commitOne = useCallback(
    (id: string, next: FilterValue | undefined) => {
      // Spreading keeps an existing filter in its position, so its chip doesn't move.
      // An empty value is removed by normalize().
      commit({ ...appliedRef.current, [id]: next });
    },
    [commit],
  );

  const clear = useCallback(
    (id: string) => {
      dropPending(id);
      commitOne(id, undefined);
    },
    [commitOne, dropPending],
  );

  const clearAll = useCallback(() => {
    updatePending(() => ({}));
    commit({});
  }, [commit, updatePending]);

  const isActive = useCallback((id: string) => !isEmptyValue(applied[id]), [applied]);

  const openEditor = useCallback(
    (id: string): FilterEditor => {
      if (!knownIds.has(id)) throw new Error(`useFilters: unknown filter id "${id}"`);

      const appliedValue = applied[id];
      const current = id in pending ? pending[id].value : appliedValue;

      const setPending = (next: FilterValue | undefined) => {
        if (applyMode === "instant") {
          dropPending(id);
          commitOne(id, next);
        } else {
          updatePending((prev) => ({ ...prev, [id]: { value: next } }));
        }
      };

      return {
        pending: current,
        setPending,
        apply: () => {
          // Read the latest pending value, not the one captured at render.
          const latest = pendingRef.current[id];
          dropPending(id);
          if (latest) commitOne(id, latest.value);
        },
        reset: () => setPending(undefined),
        canApply: !filterValuesEqual(current, appliedValue),
        discard: () => dropPending(id),
      };
    },
    [applied, applyMode, commitOne, dropPending, knownIds, pending, updatePending],
  );

  const derived = useMemo(() => {
    const byId = new Map(definitions.map((d) => [d.id, d]));
    const appliedIds = Object.keys(applied);
    return {
      quickFilters: definitions.filter((d) => d.tier === "quick"),
      moreFilters: definitions.filter((d) => d.tier === "more"),
      activeMoreFilters: appliedIds
        .map((id) => byId.get(id))
        .filter((d): d is FilterDefinition => d?.tier === "more"),
      activeCount: appliedIds.length,
    };
  }, [definitions, applied]);

  return {
    definitions,
    applyMode,
    applied,
    isActive,
    clear,
    clearAll,
    openEditor,
    ...derived,
  };
}
