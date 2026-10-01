// Date range editor (SPEC §6.2).
//
// Presets apply in one click and close, even in manual mode (the common choice shouldn't need
// a second click). "Custom date…" opens a "Filter by …" dialog with a two-month calendar;
// Apply stays disabled until both ends are picked.
//
// The custom range is a local draft until Apply, in instant mode too: a range is picked in
// two clicks, and applying after the first would run a query for a half-picked range.

"use client";

import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandItem, CommandList } from "@/components/ui/command";

import { DATE_PRESET_LABELS, DEFAULT_DATE_PRESETS } from "../presets";
import { rowPadding } from "../styles";
import { formatDateRange } from "../summary";
import type { DatePresetKey, DateRangeValue } from "../types";
import type { FilterEditorProps } from "./filter-editor";
import { FilterDialog } from "./filter-dialog";

const CUSTOM = "__custom__";

interface Draft {
  from?: Date;
  to?: Date;
}

const toIso = (date: Date) => format(date, "yyyy-MM-dd");

/** Two clicks make a range: the first sets the start, the second the end (in either order). */
export function nextDraft(draft: Draft, day: Date): Draft {
  if (!draft.from || draft.to) return { from: day, to: undefined };
  return day < draft.from ? { from: day, to: draft.from } : { from: draft.from, to: day };
}

export function DateRangeEditor({ definition, editor, onDone, autoFocus = true }: FilterEditorProps) {
  const applied = isDateRangeValue(editor.pending) ? editor.pending : undefined;
  const presets = definition.presets ?? DEFAULT_DATE_PRESETS;
  const allowCustom = definition.allowCustomRange ?? true;
  const [customOpen, setCustomOpen] = useState(false);

  // The preset list has no search input, so focus the list itself for the keyboard.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) listRef.current?.focus();
  }, [autoFocus]);

  const applyValue = (value: DateRangeValue) => {
    editor.setPending(value);
    editor.apply();
    onDone();
  };

  const selectedValue =
    applied?.kind === "preset" ? applied.preset : applied?.kind === "custom" ? CUSTOM : undefined;

  return (
    <>
      <Command
        ref={listRef}
        tabIndex={-1}
        // Start with the applied choice highlighted, or the first preset (see single-select.tsx
        // for why a row must be highlighted from the start).
        defaultValue={selectedValue ?? presets[0] ?? CUSTOM}
        label={`${definition.label} presets`}
        className="w-(--fb-popover-width) rounded-none! p-0 outline-none"
      >
        <CommandList className="p-1">
          {presets.map((key: DatePresetKey) => (
            <CommandItem
              key={key}
              value={key}
              onSelect={() => applyValue({ kind: "preset", preset: key })}
              data-checked={selectedValue === key}
              aria-checked={selectedValue === key}
              className={rowPadding}
            >
              {DATE_PRESET_LABELS[key]}
            </CommandItem>
          ))}
          {allowCustom && (
            <CommandItem
              value={CUSTOM}
              onSelect={() => setCustomOpen(true)}
              data-checked={selectedValue === CUSTOM}
              aria-checked={selectedValue === CUSTOM}
              aria-haspopup="dialog"
              className={rowPadding}
            >
              <span>Custom date…</span>
              {applied?.kind === "custom" && (
                <span className="truncate text-muted-foreground">{formatDateRange(applied)}</span>
              )}
              {/* order-last: after the check icon CommandItem appends, which already has ml-auto. */}
              <ChevronRightIcon aria-hidden className="order-last text-muted-foreground" />
            </CommandItem>
          )}
        </CommandList>
      </Command>

      {allowCustom && (
        <FilterDialog
          open={customOpen}
          onOpenChange={setCustomOpen}
          label={definition.label}
          className="sm:max-w-fit"
        >
          <CustomRange
            initial={applied?.kind === "custom" ? applied : undefined}
            onApply={(from, to) => applyValue({ kind: "custom", from, to })}
          />
        </FilterDialog>
      )}
    </>
  );
}

function CustomRange({
  initial,
  onApply,
}: {
  initial?: { from: string; to: string };
  onApply: (from: string, to: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    initial ? { from: parseISO(initial.from), to: parseISO(initial.to) } : {},
  );

  return (
    <>
      <div className="flex justify-center p-2">
        <Calendar
          mode="range"
          numberOfMonths={2}
          autoFocus
          // Show the applied range, or last month and this month.
          defaultMonth={draft.from ?? startOfMonth(subMonths(new Date(), 1))}
          selected={draft.from ? { from: draft.from, to: draft.to } : undefined}
          onSelect={(_, day) => setDraft((prev) => nextDraft(prev, day))}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
        <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
          {draft.from && draft.to
            ? `${format(draft.from, "MMM d, yyyy")} – ${format(draft.to, "MMM d, yyyy")}`
            : draft.from
              ? "Pick an end date"
              : "Pick a start date"}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={!draft.from || !draft.to}
          onClick={() => {
            if (draft.from && draft.to) onApply(toIso(draft.from), toIso(draft.to));
          }}
        >
          Apply
        </Button>
      </div>
    </>
  );
}

function isDateRangeValue(value: unknown): value is DateRangeValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "kind" in value;
}
