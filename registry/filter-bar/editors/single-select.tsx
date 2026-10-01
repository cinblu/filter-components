// Single-select editor (SPEC §6.3): a list where choosing an option applies and closes.

"use client";

import { useEffect, useRef, useState } from "react";

import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import { cn } from "@/lib/utils";

import { useFilterOptions } from "../options";
import { rowPadding, searchFocus } from "../styles";
import type { FilterEditorProps } from "./filter-editor";

export function SingleSelectEditor({ definition, editor, onDone, autoFocus = true }: FilterEditorProps) {
  const options = useFilterOptions(definition);
  const current = typeof editor.pending === "string" ? editor.pending : undefined;
  const [query, setQuery] = useState("");

  const searchable = definition.searchable ?? (options?.length ?? 0) > 7;
  const needle = query.trim().toLowerCase();
  const visible = (options ?? []).filter((o) => o.label.toLowerCase().includes(needle));

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus && !searchable) rootRef.current?.focus();
  }, [autoFocus, searchable]);

  const choose = (value: string) => {
    // One step: set and apply together. In instant mode setPending has already applied.
    editor.setPending(value);
    editor.apply();
    onDone();
  };

  return (
    <Command
      ref={rootRef}
      shouldFilter={false}
      // Start with the current choice highlighted, or the first option. Highlighting a row
      // up front matters: cmdk moves focus into its own input whenever its highlight changes
      // while any cmdk input has focus, which would steal focus from the More Filters search.
      defaultValue={current ?? options?.[0]?.value}
      tabIndex={searchable ? undefined : -1}
      label={`${definition.label} options`}
      className={cn("w-(--fb-popover-width) rounded-none! p-0 outline-none", searchFocus)}
    >
      {searchable && (
        <CommandInput
          autoFocus={autoFocus}
          placeholder={definition.searchPlaceholder ?? definition.label}
          value={query}
          onValueChange={setQuery}
        />
      )}
      <CommandList className="p-1">
        {!options ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : visible.length === 0 ? (
          <div role="status" className="py-6 text-center text-sm text-muted-foreground">
            No matches
          </div>
        ) : (
          visible.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              onSelect={() => choose(option.value)}
              // shadcn's CommandItem shows its trailing check when data-checked is true.
              data-checked={option.value === current}
              aria-checked={option.value === current}
              className={rowPadding}
            >
              {option.icon}
              <span className="truncate">{option.label}</span>
            </CommandItem>
          ))
        )}
      </CommandList>
    </Command>
  );
}
