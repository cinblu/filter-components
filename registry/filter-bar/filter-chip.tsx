// A filter chip (SPEC §5).
//
// Unset: a dashed "+ Created Date" button.
// Set:   a filled "Created Date: Last 7 days" button plus a trailing × button.
//
// The chip body opens the editor in a popover anchored to the whole chip. The editor is
// passed as children; a render function gets `close()` so it can close after applying.

"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { getFilterSummary } from "./summary";
import type { FilterDefinition, FilterValue } from "./types";

export interface FilterChipProps {
  definition: FilterDefinition;
  /** The applied value. Empty means unset. */
  value: FilterValue | undefined;
  /** Called by the × button. Should clear the filter immediately. */
  onRemove: () => void;
  /** Controlled open state of the editor popover. */
  open?: boolean;
  /** Called whenever the popover opens or closes, including Escape and outside clicks. */
  onOpenChange?: (open: boolean) => void;
  /** The editor. A function receives `close()` for closing after Apply. */
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  className?: string;
}

export function FilterChip({
  definition,
  value,
  onRemove,
  open: openProp,
  onOpenChange,
  children,
  className,
}: FilterChipProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const width = useMeasuredWidth(contentRef);

  const summary = getFilterSummary(definition, value);
  const isSet = summary !== null;
  const { label } = definition;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        {/*
          The outer box animates its width to match the content, so when a chip goes from
          "+ Status" to "Status: Open ×" its neighbours slide over instead of jumping.
        */}
        <span
          data-slot="filter-chip"
          data-state={isSet ? "set" : "unset"}
          style={{ width }}
          className={cn(
            "inline-flex shrink-0 overflow-hidden rounded-[var(--fb-chip-radius,var(--radius-sm))]",
            "transition-[width] duration-150 ease-out motion-reduce:transition-none",
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            className,
          )}
        >
          <span
            ref={contentRef}
            className={cn(
              "inline-flex h-[var(--fb-chip-height,1.75rem)] w-max items-center rounded-[inherit] border text-sm whitespace-nowrap",
              "transition-[background-color,border-color,color] duration-150 ease-out motion-reduce:transition-none",
              isSet
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground [border-style:var(--fb-chip-border-style,dashed)] hover:bg-muted hover:text-foreground",
            )}
          >
            <PopoverTrigger asChild>
              <button
                ref={triggerRef}
                type="button"
                aria-label={isSet ? `${label} filter: ${summary.full}. Edit` : `Add ${label} filter`}
                title={isSet ? `${label}: ${summary.full}` : undefined}
                className={cn(
                  "inline-flex h-full items-center gap-1 outline-none",
                  isSet ? "pr-1 pl-2.5" : "px-2.5",
                )}
              >
                {isSet ? (
                  <>
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-medium">{summary.short}</span>
                  </>
                ) : (
                  <>
                    <PlusIcon aria-hidden className="size-3.5" />
                    {label}
                  </>
                )}
              </button>
            </PopoverTrigger>
            {isSet && (
              <button
                type="button"
                aria-label={`Remove ${label} filter`}
                onClick={() => {
                  onRemove();
                  // The × disappears with the filter, so keep focus on the chip.
                  triggerRef.current?.focus();
                }}
                className="mr-1 inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:text-foreground"
              >
                <XIcon aria-hidden className="size-3.5" />
              </button>
            )}
          </span>
        </span>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        collisionPadding={8}
        aria-label={`${label} filter`}
        className="w-auto gap-0 overflow-hidden p-0"
      >
        {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Measures an element's width, so a wrapper can transition to it. CSS can't transition
 * between two `auto` widths, which is what a chip's label change is. The first measurement
 * is applied without animating, because the wrapper starts at `auto`.
 */
function useMeasuredWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState<number>();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth(element.offsetWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
