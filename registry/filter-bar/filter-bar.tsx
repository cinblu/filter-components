// The toolbar (SPEC §4). Two areas on one row:
//
//   [title] [search] [quick chips…] [active more chips…] [+ More Filters] [sort]  ···  [Clear all] [count] [actions]
//   └──────────────────────── filters: wraps within its own area ────────────┘       └── fixed, right-aligned ──┘
//
// The filters wrap inside the left area, so Clear all, the count and the actions never move.
// Clear all keeps its space while hidden, so it always appears in the same spot. On narrow
// screens the right group drops below. Nothing scrolls sideways.

"use client";

import { SearchIcon } from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FilterEditorPanel } from "./editors/filter-editor";
import { FilterChip } from "./filter-chip";
import { MoreFiltersMenu } from "./more-filters-menu";
import { SortChip } from "./sort-chip";
import type { FilterDefinition, SortState } from "./types";
import type { UseFiltersResult } from "./use-filters";

export const SEARCH_DEBOUNCE_MS = 300;

export interface FilterBarProps {
  /** From `useFilters()`. */
  filters: UseFiltersResult;
  /** Shown first, e.g. the page or table name. */
  title?: ReactNode;
  /** Optional global search. Applies while typing (debounced), without Apply. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** The active sort, shown as a chip. */
  sort?: SortState;
  onSortChange?: (sort: SortState | undefined) => void;
  /** Renders "Showing 42 of 1,200", announced politely to screen readers. */
  resultCount?: { shown: number; total: number };
  /** Right-aligned slot, e.g. export or view buttons. */
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  filters,
  title,
  search,
  sort,
  onSortChange,
  resultCount,
  actions,
  className,
}: FilterBarProps) {
  // Quick filters always show; more-tier filters only while applied (SPEC §4).
  const chips = [...filters.quickFilters, ...filters.activeMoreFilters];

  const hasFilters = filters.activeCount > 0;

  return (
    <div
      role="group"
      aria-label="Filters"
      data-slot="filter-bar"
      className={cn("flex flex-wrap items-start gap-x-4 gap-y-2", className)}
    >
      <div className="flex min-w-0 flex-1 basis-[min(100%,18rem)] flex-wrap items-center gap-(--fb-chip-gap)">
        {title && <div className="mr-1.5 flex h-(--fb-chip-h) shrink-0 items-center">{title}</div>}
        {search && <SearchInput {...search} />}
        {chips.map((definition) => (
          <FilterBarChip key={definition.id} filters={filters} definition={definition} />
        ))}
        {filters.moreFilters.length > 0 && <MoreFiltersMenu filters={filters} />}
        {sort && onSortChange && <SortChip sort={sort} onSortChange={onSortChange} />}
      </div>

      <div className="ml-auto flex h-(--fb-chip-h) shrink-0 items-center gap-3">
        {/* Clears filters only; search and sort stay (SPEC decision 5). Hidden, not removed,
            when nothing is set, so it doesn't shift the count and actions. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={filters.clearAll}
          aria-hidden={hasFilters ? undefined : true}
          tabIndex={hasFilters ? undefined : -1}
          className={cn(
            "h-(--fb-chip-h) px-(--fb-chip-px) text-(length:--fb-chip-font-size) text-muted-foreground",
            !hasFilters && "invisible",
          )}
        >
          Clear all
        </Button>
        {resultCount && (
          <p aria-live="polite" className="text-(length:--fb-chip-font-size) text-muted-foreground tabular-nums">
            Showing {resultCount.shown.toLocaleString()} of {resultCount.total.toLocaleString()}
          </p>
        )}
        {actions}
      </div>
    </div>
  );
}

/** A chip wired to `useFilters`, with the right editor for its type. */
export function FilterBarChip({
  filters,
  definition,
}: {
  filters: UseFiltersResult;
  definition: FilterDefinition;
}) {
  const editor = filters.openEditor(definition.id);
  return (
    <FilterChip
      definition={definition}
      value={filters.applied[definition.id]}
      onRemove={() => filters.clear(definition.id)}
      // Escape, clicking outside and closing after Apply all end here. After Apply there is
      // nothing pending, so this only throws away edits that weren't applied.
      onOpenChange={(open) => {
        if (!open) editor.discard();
      }}
    >
      {({ close }) => (
        <FilterEditorPanel
          definition={definition}
          editor={editor}
          applyMode={filters.applyMode}
          onDone={close}
        />
      )}
    </FilterChip>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search",
}: NonNullable<FilterBarProps["search"]>) {
  const [text, setText] = useState(value);

  // Follow outside changes to the value (e.g. a reset), without fighting the user's typing.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // Search applies as you type, but waits for a pause so each keystroke isn't a new query.
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onChangeRef.current(text), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <div className="relative w-full max-w-56 min-w-36 shrink-0 sm:w-56">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-(--fb-chip-h) rounded-(--fb-chip-radius) pl-7 text-(length:--fb-chip-font-size) focus-visible:border-primary"
      />
    </div>
  );
}
