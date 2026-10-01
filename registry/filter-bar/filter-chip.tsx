// A filter chip (SPEC §5).
//
// Unset:  [+ Created Date]                 dashed; the whole chip opens the editor
// Set:    [× Created Date  1 week ago ▾]   solid; × clears, the rest opens the editor
//
// The leading icon is the same element in both states: the + turns 45° into the ×, so
// setting a filter reads as one continuous change. The value is in the primary colour and is
// cut off with an ellipsis at the chip's max width; the tooltip shows it in full. The chevron
// points up while the editor is open.

"use client";

import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  POPOVER_OFFSET,
  chipBase,
  chipSet,
  chipTransition,
  chipUnset,
  popoverMotion,
} from "./styles";
import { getFilterSummary } from "./summary";
import type { FilterDefinition, FilterValue } from "./types";

export const TOOLTIP_DELAY_MS = 400;

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
  const tooltip = useChipTooltip(open);

  const summary = getFilterSummary(definition, value);
  const isSet = summary !== null;
  const { label } = definition;
  const tooltipText = isSet ? summary.tooltip : definition.description;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        {/*
          The outer box animates its width to match the content, so when a chip goes from
          "+ Status" to "× Status  Open ▾" its neighbours slide over instead of jumping.
        */}
        <span
          data-slot="filter-chip"
          data-state={isSet ? "set" : "unset"}
          style={{ width }}
          className={cn(
            "inline-flex max-w-(--fb-chip-max-width) min-w-(--fb-chip-min-width) shrink-0 overflow-hidden rounded-(--fb-chip-radius)",
            "transition-[width] duration-150 ease-out motion-reduce:transition-none",
            "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
            className,
          )}
        >
          <span
            ref={contentRef}
            className={cn(chipBase, chipTransition, "w-max", isSet ? chipSet : chipUnset)}
          >
            <button
              type="button"
              // Unset, the + is just part of the "add" button: hidden from assistive tech and
              // skipped by Tab, but clicking it still opens the editor.
              aria-label={isSet ? `Remove ${label} filter` : undefined}
              aria-hidden={isSet ? undefined : true}
              tabIndex={isSet ? undefined : -1}
              onClick={() => {
                if (!isSet) return setOpen(true);
                onRemove();
                // The × becomes a decorative + again, so keep focus on the chip body.
                triggerRef.current?.focus();
              }}
              className={cn(
                "inline-flex h-full shrink-0 items-center rounded-l-[inherit] pr-0.5 pl-(--fb-chip-px) outline-none",
                isSet && "text-muted-foreground hover:text-foreground focus-visible:text-foreground",
              )}
            >
              <PlusIcon
                aria-hidden
                className={cn(
                  "size-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                  isSet && "rotate-45",
                )}
              />
            </button>
            <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>
              <Tooltip open={tooltip.open && Boolean(tooltipText)} onOpenChange={tooltip.onOpenChange}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      ref={triggerRef}
                      type="button"
                      onPointerEnter={tooltip.onPointerEnter}
                      aria-label={isSet ? `${label} filter: ${summary.full}. Edit` : `Add ${label} filter`}
                      className="inline-flex h-full min-w-0 items-center gap-1.5 rounded-r-[inherit] pr-(--fb-chip-px) outline-none"
                    >
                      <span className="shrink-0">{label}</span>
                      {isSet && (
                        <>
                          <span className="min-w-0 truncate font-medium text-primary">
                            {summary.short}
                          </span>
                          <ChevronDownIcon
                            aria-hidden
                            className={cn(
                              "-ml-0.5 size-3.5 shrink-0 text-primary transition-transform duration-150 ease-out motion-reduce:transition-none",
                              open && "rotate-180",
                            )}
                          />
                        </>
                      )}
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  sideOffset={POPOVER_OFFSET}
                  className={cn("max-w-sm", popoverMotion)}
                >
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </span>
        </span>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={POPOVER_OFFSET}
        collisionPadding={8}
        aria-label={`${label} filter`}
        className={cn("w-auto gap-0 overflow-hidden p-0", popoverMotion)}
      >
        {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Tooltip state for a chip: hover/focus shows it, but not while the editor is open, and not
 * when focus comes back to the chip as the editor closes (that would pop it up unasked).
 */
function useChipTooltip(editorOpen: boolean) {
  const [open, setOpen] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const [wasEditorOpen, setWasEditorOpen] = useState(editorOpen);
  if (editorOpen !== wasEditorOpen) {
    setWasEditorOpen(editorOpen);
    if (!editorOpen) setSuppressed(true);
  }
  return {
    open: open && !editorOpen && !suppressed,
    onOpenChange: (next: boolean) => {
      setOpen(next);
      // Once the tooltip would close (pointer leaves, focus moves), it may show again.
      if (!next) setSuppressed(false);
    },
    // A deliberate hover always counts.
    onPointerEnter: () => setSuppressed(false),
  };
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
