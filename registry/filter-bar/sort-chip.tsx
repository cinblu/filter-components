// The sort chip (SPEC §8): [× Sort: Created Date  Newest first ▾]
//
// Keeps the active sort visible in the toolbar, even when the sorted column's header has
// scrolled out of view. It looks and behaves like a set filter chip: × removes the sort, and
// the chip opens a short menu to pick the direction.

"use client";

import { ChevronDownIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  POPOVER_OFFSET,
  accentScope,
  chipBase,
  chipSet,
  chipTransition,
  popoverMotion,
  rowPadding,
} from "./styles";
import type { SortState } from "./types";

export interface SortChipProps {
  sort?: SortState;
  onSortChange: (sort: SortState | undefined) => void;
  className?: string;
}

const DEFAULT_DIRECTION_LABELS = { asc: "Ascending", desc: "Descending" };

export function SortChip({ sort, onSortChange, className }: SortChipProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  if (!sort) return null;

  const labels = sort.directionLabels ?? DEFAULT_DIRECTION_LABELS;
  const current = labels[sort.direction];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span
          data-slot="sort-chip"
          className={cn(
            chipBase,
            chipSet,
            chipTransition,
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            accentScope,
            className,
          )}
        >
          <button
            type="button"
            aria-label="Remove sort"
            onClick={() => onSortChange(undefined)}
            className="inline-flex h-full shrink-0 items-center rounded-l-[inherit] pr-0.5 pl-(--fb-chip-px) text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Sorted by ${sort.label}, ${current}. Change direction`}
              className="inline-flex h-full min-w-0 items-center gap-1.5 rounded-r-[inherit] pr-(--fb-chip-px) outline-none"
            >
              {/* "Sort:" is a fixed label, so the chip reads differently from filters. */}
              <span className="shrink-0">Sort: {sort.label}</span>
              <span className="min-w-0 truncate font-medium text-primary">{current}</span>
              <ChevronDownIcon
                aria-hidden
                className={cn(
                  "-ml-0.5 size-3.5 shrink-0 text-primary transition-transform duration-150 ease-out motion-reduce:transition-none",
                  open && "rotate-180",
                )}
              />
            </button>
          </PopoverTrigger>
        </span>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={POPOVER_OFFSET}
        collisionPadding={8}
        aria-label="Sort direction"
        className={cn("w-auto min-w-44 gap-0 overflow-hidden p-0", accentScope, popoverMotion)}
        // The list has no input, so focus it directly for the arrow keys.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          listRef.current?.focus();
        }}
      >
        <Command
          ref={listRef}
          tabIndex={-1}
          defaultValue={sort.direction}
          label="Sort direction"
          className="rounded-none! p-0 outline-none"
        >
          <CommandList className="p-1">
            {(["asc", "desc"] as const).map((direction) => (
              <CommandItem
                key={direction}
                value={direction}
                data-checked={sort.direction === direction}
                aria-checked={sort.direction === direction}
                onSelect={() => {
                  if (direction !== sort.direction) onSortChange({ ...sort, direction });
                  setOpen(false);
                }}
                className={rowPadding}
              >
                {labels[direction]}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
