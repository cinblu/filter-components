// Date range editor (SPEC §6.2).
//
// Presets apply in one click and close, even in manual mode ("Last 7 days" is the most common
// choice, so it shouldn't need a second click). "Custom range…" opens a two-month calendar
// with Reset and Apply; Apply stays disabled until both ends are picked.
//
// The custom range is a local draft until Apply, in instant mode too: a range is picked in
// two clicks, and applying after the first one would run a query for a half-picked range.

"use client";

import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";

import { DATE_PRESET_LABELS, DEFAULT_DATE_PRESETS } from "../presets";
import { formatDateRange } from "../summary";
import type { DatePresetKey, DateRangeValue } from "../types";
import type { FilterEditorProps } from "./filter-editor";

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

  const [view, setView] = useState<"presets" | "custom">("presets");
  const [draft, setDraft] = useState<Draft>(() =>
    applied?.kind === "custom"
      ? { from: parseISO(applied.from), to: parseISO(applied.to) }
      : {},
  );

  // The preset list has no search input, so focus the list itself for the keyboard.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus && view === "presets") listRef.current?.focus();
  }, [autoFocus, view]);

  const applyValue = (value: DateRangeValue | undefined) => {
    editor.setPending(value);
    editor.apply();
    onDone();
  };

  if (view === "custom") {
    return (
      <div className="flex w-max flex-col">
        <div className="flex items-center gap-1 p-1.5 pb-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setView("presets")}
            className="gap-1 px-2 text-muted-foreground"
          >
            <ChevronLeftIcon aria-hidden />
            Presets
          </Button>
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          autoFocus={autoFocus}
          // Show the applied range, or last month and this month.
          defaultMonth={draft.from ?? startOfMonth(subMonths(new Date(), 1))}
          selected={draft.from ? { from: draft.from, to: draft.to } : undefined}
          onSelect={(_, day) => setDraft((prev) => nextDraft(prev, day))}
        />
        <Separator />
        <div className="flex items-center justify-between p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDraft({})}
            disabled={!draft.from}
          >
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!draft.from || !draft.to}
            onClick={() => {
              if (draft.from && draft.to) {
                applyValue({ kind: "custom", from: toIso(draft.from), to: toIso(draft.to) });
              }
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }

  const selectedValue =
    applied?.kind === "preset" ? applied.preset : applied?.kind === "custom" ? CUSTOM : undefined;

  return (
    <Command
      // Start with the applied choice highlighted, or the first preset (see single-select.tsx
      // for why a row must be highlighted from the start).
      defaultValue={selectedValue ?? presets[0] ?? CUSTOM}
      label={`${definition.label} presets`}
      className="w-[var(--fb-popover-width,18rem)] rounded-none! p-0 outline-none"
      ref={listRef}
      tabIndex={-1}
    >
      <CommandList className="p-1">
        {presets.map((key: DatePresetKey) => (
          <CommandItem
            key={key}
            value={key}
            onSelect={() => applyValue({ kind: "preset", preset: key })}
            data-checked={selectedValue === key}
            aria-checked={selectedValue === key}
          >
            {DATE_PRESET_LABELS[key]}
          </CommandItem>
        ))}
        {allowCustom && (
          <CommandItem
            value={CUSTOM}
            onSelect={() => setView("custom")}
            data-checked={selectedValue === CUSTOM}
            aria-checked={selectedValue === CUSTOM}
          >
            <span>Custom range…</span>
            {applied?.kind === "custom" && (
              <span className="truncate text-muted-foreground">{formatDateRange(applied)}</span>
            )}
            {/* order-last: after the check icon CommandItem appends, which already has ml-auto. */}
            <ChevronRightIcon aria-hidden className="order-last text-muted-foreground" />
          </CommandItem>
        )}
      </CommandList>
    </Command>
  );
}

function isDateRangeValue(value: unknown): value is DateRangeValue {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "kind" in value;
}
