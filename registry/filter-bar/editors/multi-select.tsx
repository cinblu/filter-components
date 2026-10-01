// Multi-select editor (SPEC §6.1).
//
// Keyboard (manual mode):
//   type        → search
//   ↑ / ↓       → move the highlight
//   Space       → toggle the highlighted row (after moving with ↑/↓; otherwise it types a space)
//   Enter       → apply, when there is something to apply
//   Escape      → discard and close (handled by the popover)
// In instant mode there is no Apply, so Enter toggles the highlighted row instead.

"use client";

import {
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

import { useFilterOptions } from "../options";
import { rowPadding, searchFocus } from "../styles";
import type { FilterOption } from "../types";
import type { FilterEditorProps } from "./filter-editor";

const SELECT_ALL = "__select-all__";
const itemValue = (value: string) => `option:${value}`;

/** Options that are already selected first (keeping their relative order), then the rest. */
export function orderSelectedFirst(options: FilterOption[], selected: string[]): FilterOption[] {
  const set = new Set(selected);
  return [...options.filter((o) => set.has(o.value)), ...options.filter((o) => !set.has(o.value))];
}

export function MultiSelectEditor({
  definition,
  editor,
  applyMode,
  onDone,
  autoFocus = true,
}: FilterEditorProps) {
  const options = useFilterOptions(definition);
  const selected = new Set(Array.isArray(editor.pending) ? editor.pending : []);

  // Selected-first order is worked out once, when the editor opens (this component mounts
  // with the popover), and then frozen. Re-sorting on every tick would make rows jump under
  // the cursor. The new order shows up the next time the editor opens.
  // `pinned` remembers what was selected at that moment, to draw the divider under that group.
  const freeze = (list: FilterOption[]) => ({
    order: orderSelectedFirst(list, [...selected]),
    pinned: new Set(selected),
  });
  const [frozen, setFrozen] = useState(() => (options ? freeze(options) : undefined));
  // Async options: freeze the order as soon as they arrive.
  if (options && !frozen) setFrozen(freeze(options));
  const frozenOrder = frozen?.order;

  const [query, setQuery] = useState("");
  // Start with the first row highlighted. cmdk moves focus into its own input whenever its
  // highlight changes while *any* cmdk input has focus, so letting it pick the first row
  // after mounting would pull focus out of the More Filters search on hover.
  const [highlighted, setHighlighted] = useState(SELECT_ALL);
  // True after ↑/↓, false after typing. Decides whether Space toggles or types.
  const [navigating, setNavigating] = useState(false);

  const searchable = definition.searchable ?? (options?.length ?? 0) > 7;
  const needle = query.trim().toLowerCase();
  const visible = (frozenOrder ?? []).filter((o) => o.label.toLowerCase().includes(needle));
  // The divider goes after the last visible option that was selected when the editor opened,
  // as long as other options follow it.
  const pinnedVisible = visible.filter((o) => frozen?.pinned.has(o.value)).length;
  const showDivider = pinnedVisible > 0 && pinnedVisible < visible.length;
  const visibleSelectedCount = visible.filter((o) => selected.has(o.value)).length;
  const allVisibleSelected = visible.length > 0 && visibleSelectedCount === visible.length;
  const selectAllState = allVisibleSelected ? true : visibleSelectedCount > 0 ? "indeterminate" : false;

  // Without a search input, focus the list itself so the keyboard works straight away.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus && !searchable) rootRef.current?.focus();
  }, [autoFocus, searchable]);

  // New values keep option order; values that aren't options (e.g. from an old URL) are kept.
  const setSelection = (next: Set<string>) => {
    const known = (options ?? []).map((o) => o.value);
    const unknown = [...next].filter((v) => !known.includes(v));
    editor.setPending([...known.filter((v) => next.has(v)), ...unknown]);
  };

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSelection(next);
  };

  // Select all acts on the visible (search-filtered) options only.
  const toggleAllVisible = () => {
    const next = new Set(selected);
    for (const o of visible) {
      if (allVisibleSelected) next.delete(o.value);
      else next.add(o.value);
    }
    setSelection(next);
  };

  // A stable callback for the rows, so toggling one option re-renders only that row
  // instead of all of them (this is what keeps 500 options smooth).
  const toggleRef = useRef(toggle);
  useLayoutEffect(() => {
    toggleRef.current = toggle;
  });
  const onToggle = useCallback((value: string) => toggleRef.current(value), []);

  const toggleHighlighted = () => {
    if (highlighted === SELECT_ALL) toggleAllVisible();
    else {
      const option = visible.find((o) => itemValue(o.value) === highlighted);
      if (option) toggle(option.value);
    }
  };

  const apply = () => {
    editor.apply();
    onDone();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      setNavigating(true);
    } else if (event.key === " " && (navigating || !searchable)) {
      event.preventDefault();
      toggleHighlighted();
    } else if (event.key === "Enter" && applyMode === "manual") {
      // Stop cmdk from toggling the highlighted row; Enter means Apply here.
      event.preventDefault();
      if (editor.canApply) apply();
    }
  };

  const placeholder = definition.searchPlaceholder ?? definition.label;

  return (
    <Command
      ref={rootRef}
      shouldFilter={false}
      value={highlighted}
      onValueChange={setHighlighted}
      onKeyDown={handleKeyDown}
      tabIndex={searchable ? undefined : -1}
      label={`${definition.label} options`}
      className={cn("w-(--fb-popover-width) rounded-none! p-0 outline-none", searchFocus)}
    >
      {searchable && (
        <CommandInput
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onValueChange={(next) => {
            setQuery(next);
            setNavigating(false);
          }}
        />
      )}
      <CommandList className="p-1" aria-multiselectable="true">
        {!frozenOrder ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : visible.length === 0 ? (
          <div role="status" className="py-6 text-center text-sm text-muted-foreground">
            No matches
          </div>
        ) : (
          <>
            <CommandItem
              value={SELECT_ALL}
              onSelect={toggleAllVisible}
              aria-checked={selectAllState === "indeterminate" ? "mixed" : selectAllState}
              className={rowPadding}
            >
              <CheckMark checked={selectAllState} />
              <span>Select all</span>
            </CommandItem>
            {visible.map((option, index) => (
              <OptionRow
                key={option.value}
                option={option}
                checked={selected.has(option.value)}
                onToggle={onToggle}
                dividerAbove={showDivider && index === pinnedVisible}
              />
            ))}
          </>
        )}
      </CommandList>
      {applyMode === "manual" && (
        <>
          <Separator />
          <div className="flex items-center justify-between p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.reset()}
              disabled={selected.size === 0}
              className="text-primary hover:text-primary"
            >
              Reset
            </Button>
            <Button type="button" size="sm" onClick={apply} disabled={!editor.canApply}>
              Apply
            </Button>
          </div>
        </>
      )}
    </Command>
  );
}

const OptionRow = memo(function OptionRow({
  option,
  checked,
  onToggle,
  dividerAbove,
}: {
  option: FilterOption;
  checked: boolean;
  onToggle: (value: string) => void;
  /** Draws the line under the "selected when opened" group. A line on the row, rather than a
   *  separator element, because a listbox may only contain options. */
  dividerAbove?: boolean;
}) {
  return (
    <CommandItem
      value={itemValue(option.value)}
      onSelect={() => onToggle(option.value)}
      aria-checked={checked}
      data-divider-above={dividerAbove || undefined}
      className={cn(
        rowPadding,
        dividerAbove &&
          "relative mt-2 before:pointer-events-none before:absolute before:inset-x-0 before:-top-1 before:h-px before:bg-border",
      )}
    >
      <CheckMark checked={checked} />
      {option.icon}
      <span className="truncate">{option.label}</span>
    </CommandItem>
  );
});

/**
 * The checkbox drawn in each row. It's only a picture: the row is the control (it carries
 * aria-checked), so a real checkbox here would be a second, redundant control. Styled to
 * match shadcn's Checkbox, plus the "some selected" state that Select all needs.
 */
function CheckMark({ checked }: { checked: boolean | "indeterminate" }) {
  const on = checked !== false;
  return (
    <span
      aria-hidden
      data-state={checked === "indeterminate" ? "indeterminate" : on ? "checked" : "unchecked"}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors duration-100 motion-reduce:transition-none dark:bg-input/30",
        on && "border-primary bg-primary text-primary-foreground dark:bg-primary",
      )}
    >
      {checked === "indeterminate" ? (
        <MinusIcon className="size-3" />
      ) : on ? (
        <CheckIcon className="size-3" />
      ) : null}
    </span>
  );
}
