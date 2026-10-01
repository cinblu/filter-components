// Optional URL sync (SPEC §11).
//
//   const url = useFilterUrlState(definitions);
//   const filters = useFilters({ definitions, ...url });
//
// Format, one param per filter id:
//   multiSelect   ?status=open,closed
//   singleSelect  ?workflow=two-step
//   text          ?batchId=B-10042
//   dateRange     ?createdAt=last7d             (a preset key, so it stays relative)
//                 ?createdAt=2026-04-18_2026-04-24
//
// Params that aren't filter ids are left untouched, and unknown or malformed values are
// ignored. Changes use history.replaceState, so editing filters doesn't fill the back button
// with every intermediate state. This uses the plain History API, so it works with any
// router; Next.js (App Router) keeps useSearchParams in sync with it.

"use client";

import { isValid, parseISO } from "date-fns";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import { isDatePresetKey } from "./presets";
import type { FilterDefinition, FilterState, FilterValue } from "./types";
import { isEmptyValue } from "./use-filters";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (text: string | undefined) =>
  text !== undefined && ISO_DATE.test(text) && isValid(parseISO(text));
const RANGE_SEPARATOR = "_";
const LIST_SEPARATOR = ",";

// Values are percent-encoded one by one, so a comma inside a value ("%2C") can't be mistaken
// for the separator. That's also why this parses the raw query string itself instead of
// using URLSearchParams, which would decode "%2C" and "," to the same thing.
const encode = (text: string) => encodeURIComponent(text);
const decode = (text: string) => {
  try {
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    return undefined; // malformed escape, e.g. "%E0%A4%A"
  }
};

/** Splits "?a=1&b=2" into raw (still encoded) key/value pairs, keeping their order. */
function splitQuery(search: string): [string, string][] {
  return search
    .replace(/^\?/, "")
    .split("&")
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      return index === -1 ? [part, ""] : [part.slice(0, index), part.slice(index + 1)];
    });
}

function encodeValue(definition: FilterDefinition, value: FilterValue): string | undefined {
  if (isEmptyValue(value)) return undefined;
  if (definition.type === "multiSelect") {
    return Array.isArray(value) ? value.map(encode).join(LIST_SEPARATOR) : undefined;
  }
  if (definition.type === "dateRange") {
    if (typeof value !== "object" || Array.isArray(value)) return undefined;
    return value.kind === "preset" ? value.preset : `${value.from}${RANGE_SEPARATOR}${value.to}`;
  }
  return typeof value === "string" ? encode(value) : undefined;
}

function decodeValue(definition: FilterDefinition, raw: string): FilterValue | undefined {
  if (definition.type === "multiSelect") {
    const values = raw.split(LIST_SEPARATOR).map(decode);
    if (values.some((v) => v === undefined)) return undefined;
    const list = (values as string[]).filter(Boolean);
    return list.length > 0 ? [...new Set(list)] : undefined;
  }
  if (definition.type === "dateRange") {
    if (isDatePresetKey(raw)) return { kind: "preset", preset: raw };
    const [from, to, ...rest] = raw.split(RANGE_SEPARATOR);
    if (rest.length > 0 || !isIsoDate(from) || !isIsoDate(to)) return undefined;
    return from <= to ? { kind: "custom", from, to } : { kind: "custom", from: to, to: from };
  }
  const text = decode(raw);
  return text ? text : undefined;
}

/** Reads filter state from a query string. Unknown params and bad values are ignored. */
export function parseFilterQuery(search: string, definitions: FilterDefinition[]): FilterState {
  const byId = new Map(definitions.map((d) => [d.id, d]));
  const state: FilterState = {};
  for (const [rawKey, rawValue] of splitQuery(search)) {
    const definition = byId.get(decode(rawKey) ?? "");
    if (!definition) continue;
    const value = decodeValue(definition, rawValue);
    if (value !== undefined) state[definition.id] = value;
  }
  return state;
}

/**
 * Writes filter state into a query string. Params that aren't filters keep their place;
 * filter params are written after them, in the order the filters were applied.
 */
export function serializeFilterQuery(
  state: FilterState,
  definitions: FilterDefinition[],
  currentSearch = "",
): string {
  const ids = new Set(definitions.map((d) => d.id));
  const kept = splitQuery(currentSearch).filter(([key]) => !ids.has(decode(key) ?? ""));
  const byId = new Map(definitions.map((d) => [d.id, d]));
  const written: [string, string][] = [];
  for (const [id, value] of Object.entries(state)) {
    const definition = byId.get(id);
    const encoded = definition && value !== undefined ? encodeValue(definition, value) : undefined;
    if (encoded !== undefined) written.push([encode(id), encoded]);
  }
  const query = [...kept, ...written].map(([k, v]) => (v === "" ? k : `${k}=${v}`)).join("&");
  return query ? `?${query}` : "";
}

// --- Subscribing to the URL -------------------------------------------------------------

// replaceState doesn't fire an event, so writes announce themselves with this one.
const URL_CHANGE_EVENT = "filter-bar:urlchange";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_CHANGE_EVENT, onChange);
  };
}
const getSearch = () => window.location.search;
// On the server there's no URL to read, so the first render shows no filters and the
// client fills them in straight after hydration.
const getServerSearch = () => "";

export function useFilterUrlState(definitions: FilterDefinition[]) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const value = useMemo(() => parseFilterQuery(search, definitions), [search, definitions]);

  const onChange = useCallback(
    (next: FilterState) => {
      const { pathname, search: current, hash } = window.location;
      const query = serializeFilterQuery(next, definitions, current);
      if (query === current) return;
      window.history.replaceState(window.history.state, "", `${pathname}${query}${hash}`);
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    },
    [definitions],
  );

  return { value, onChange };
}
