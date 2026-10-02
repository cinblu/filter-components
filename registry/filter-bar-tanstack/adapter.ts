// TanStack Table adapter (SPEC §11). A separate registry item, so the filter bar itself
// doesn't depend on TanStack.
//
// For client-side filtering: give each column the same id as its filter definition, set its
// filterFn, and pass `toColumnFilters(filters.applied, definitions)` as the table's
// columnFilters state. For server-side filtering, skip this and use useFilters' onChange.
//
//   const columnFilters = useMemo(() => toColumnFilters(filters.applied, definitions), [...]);
//   useReactTable({ columns, data, state: { columnFilters }, getFilteredRowModel: ... });
//
//   { id: "status", accessorKey: "status", filterFn: multiSelectFn }

import type { ColumnFiltersState, FilterFn } from "@tanstack/react-table";

// Relative imports: this file installs to components/filter-bar-tanstack/, next to the
// filter bar in components/filter-bar/ (the same layout as this repo's registry/ folder).
import { resolveDateRange } from "../filter-bar/presets";
import type { DateRangeValue, FilterDefinition, FilterState } from "../filter-bar/types";
import { isEmptyValue } from "../filter-bar/use-filters";

// The filter functions are typed FilterFn<any>, like TanStack's own built-ins, so they fit a
// column of any row type without a cast (FilterFn<unknown> wouldn't; it isn't assignable).
/* eslint-disable @typescript-eslint/no-explicit-any */

/** Applied filters → TanStack columnFilters. The column id is the filter id. */
export function toColumnFilters(
  state: FilterState,
  definitions: FilterDefinition[],
): ColumnFiltersState {
  const ids = new Set(definitions.map((d) => d.id));
  return Object.entries(state)
    .filter(([id, value]) => ids.has(id) && !isEmptyValue(value))
    .map(([id, value]) => ({ id, value }));
}

/** Keeps rows whose value is one of the selected values. */
export const multiSelectFn: FilterFn<any> = (row, columnId, filterValue: string[]) => {
  return filterValue.includes(String(row.getValue(columnId)));
};

/** Keeps rows whose value equals the selected value. */
export const singleSelectFn: FilterFn<any> = (row, columnId, filterValue: string) => {
  return String(row.getValue(columnId)) === filterValue;
};

/** Case-insensitive "contains". */
export const textFn: FilterFn<any> = (row, columnId, filterValue: string) => {
  return String(row.getValue(columnId) ?? "")
    .toLowerCase()
    .includes(filterValue.trim().toLowerCase());
};

/**
 * Keeps rows whose date falls in the range, both ends inclusive. Presets are resolved when the
 * filter runs, so "Last 7 days" always means the last 7 days from now.
 * The column value can be a Date, an ISO string or a timestamp.
 */
export const dateRangeFn: FilterFn<any> = (row, columnId, filterValue: DateRangeValue) => {
  const raw = row.getValue<Date | string | number | null | undefined>(columnId);
  if (raw === null || raw === undefined) return false;
  const time = new Date(raw).getTime();
  if (Number.isNaN(time)) return false;
  const { from, to } = resolveDateRange(filterValue, new Date());
  return time >= from.getTime() && time <= to.getTime();
};
/* eslint-enable @typescript-eslint/no-explicit-any */
