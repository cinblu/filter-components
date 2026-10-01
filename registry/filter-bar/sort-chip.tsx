// The sort chip (SPEC §8): "↓ Created Date".
//
// Keeps the active sort visible in the toolbar, even when the sorted column's header has
// scrolled out of view. Clicking the chip flips the direction; × removes the sort.

"use client";

import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { SortState } from "./types";

export interface SortChipProps {
  sort?: SortState;
  onSortChange: (sort: SortState | undefined) => void;
  className?: string;
}

export function SortChip({ sort, onSortChange, className }: SortChipProps) {
  if (!sort) return null;

  const descending = sort.direction === "desc";
  const Arrow = descending ? ArrowDownIcon : ArrowUpIcon;
  const current = descending ? "descending" : "ascending";
  const other = descending ? "ascending" : "descending";

  return (
    <span
      data-slot="sort-chip"
      className={cn(
        "inline-flex h-[var(--fb-chip-height,1.75rem)] shrink-0 items-center rounded-[var(--fb-chip-radius,var(--radius-sm))] border border-transparent bg-secondary text-sm whitespace-nowrap text-secondary-foreground",
        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Sorted by ${sort.label}, ${current}. Sort ${other}`}
        title={`Sort ${other}`}
        onClick={() => onSortChange({ ...sort, direction: descending ? "asc" : "desc" })}
        className="inline-flex h-full items-center gap-1 pr-1 pl-2 font-medium outline-none"
      >
        <Arrow aria-hidden className="size-3.5" />
        {sort.label}
      </button>
      <button
        type="button"
        aria-label="Remove sort"
        onClick={() => onSortChange(undefined)}
        className="mr-1 inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:text-foreground"
      >
        <XIcon aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}
