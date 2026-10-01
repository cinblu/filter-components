// The More Filters menu (SPEC §7).
//
// A dashed "+ More Filters" chip opens a searchable list of every more-tier filter.
// - Select and date filters (marked ›) open their editor as a second card, 8px to the right
//   of the list ("Queue Name › → Queues"). Below 640px there's no room for two cards, so the
//   editor replaces the list and gets a Back button.
// - Text filters open a "Filter by …" dialog instead, which gives the input room and focus.
//
// Keyboard: ↑/↓ move, → or Enter opens the editor, ← or Escape in the editor returns to the
// list, Escape on the list closes the menu. Applying in an editor closes the whole menu.

"use client";

import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { FilterDialog } from "./editors/filter-dialog";
import { FilterEditorPanel } from "./editors/filter-editor";
import { TextEditor } from "./editors/text";
import {
  POPOVER_OFFSET,
  accentScope,
  chipBase,
  chipTransition,
  chipUnset,
  popoverMotion,
  rowPadding,
  searchFocus,
} from "./styles";
import { getFilterSummary } from "./summary";
import type { FilterDefinition } from "./types";
import type { UseFiltersResult } from "./use-filters";

export interface MoreFiltersMenuProps {
  filters: UseFiltersResult;
  /** Trigger label. Default "More Filters". */
  label?: string;
  className?: string;
}

// How long the pointer must rest on an item before its editor opens. Without a delay, moving
// the mouse diagonally towards the editor card would open every item it crosses.
const HOVER_DELAY_MS = 150;
const WIDE_SCREEN = "(min-width: 640px)";

/** Text filters open in a dialog; everything else in the side card. */
const opensInDialog = (definition: FilterDefinition) => definition.type === "text";

/** The look of a popover surface, for the two cards inside the menu's transparent wrapper. */
const card = "rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10";

export function MoreFiltersMenu({ filters, label = "More Filters", className }: MoreFiltersMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState("");
  // The filter whose editor is showing, and whether that editor should take focus.
  const [active, setActive] = useState<{ id: string; focus: boolean } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const needle = query.trim().toLowerCase();
  const visible = filters.moreFilters.filter((d) => d.label.toLowerCase().includes(needle));
  const activeDefinition = active && filters.moreFilters.find((d) => d.id === active.id);
  const panelDefinition = activeDefinition && !opensInDialog(activeDefinition) ? activeDefinition : null;
  const dialogDefinition = activeDefinition && opensInDialog(activeDefinition) ? activeDefinition : null;

  const openEditor = (id: string, focus: boolean) => {
    clearTimeout(hoverTimer.current);
    if (active && active.id !== id) filters.openEditor(active.id).discard();
    setHighlighted(id);
    setActive({ id, focus });
  };

  const closeEditor = () => {
    if (active) filters.openEditor(active.id).discard();
    setActive(null);
    searchRef.current?.focus();
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      clearTimeout(hoverTimer.current);
      if (active) filters.openEditor(active.id).discard();
      setActive(null);
      setQuery("");
    }
  };

  const handleHover = (definition: FilterDefinition) => {
    clearTimeout(hoverTimer.current);
    // Hover only opens side cards, and only when there's room for them. On narrow screens
    // the editor replaces the list, which would be jarring on hover.
    const wide = window.matchMedia?.(WIDE_SCREEN).matches ?? true;
    if (opensInDialog(definition) || active?.id === definition.id || !wide) return;
    // Don't swap editors under someone who's using the open one: they've focused it
    // (typing, picking) or have unapplied changes in it.
    const busy =
      editorPanelRef.current?.contains(document.activeElement) ||
      (active && filters.openEditor(active.id).canApply);
    if (busy) return;
    hoverTimer.current = setTimeout(() => openEditor(definition.id, false), HOVER_DELAY_MS);
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" || !highlighted) return;
    // → only opens the editor when the caret is at the end of the search text, so it can
    // still be used to move through what was typed.
    const input = searchRef.current;
    if (input && input.selectionStart !== input.value.length) return;
    event.preventDefault();
    openEditor(highlighted, true);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" || event.defaultPrevented) return;
    // In a text field, ← moves the caret until it reaches the start.
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.selectionStart !== 0) return;
    event.preventDefault();
    closeEditor();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            chipBase,
            chipUnset,
            chipTransition,
            "gap-1 px-(--fb-chip-px) outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            className,
          )}
        >
          <PlusIcon aria-hidden className="size-3.5" />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={POPOVER_OFFSET}
        collisionPadding={8}
        aria-label={label}
        // A transparent wrapper around two cards: the list, and the editor 8px to its right.
        className={cn(
          "w-auto flex-row items-start gap-2 bg-transparent p-0 shadow-none ring-0",
          accentScope,
          popoverMotion,
        )}
        // Escape inside an editor goes back to the list instead of closing the menu.
        onEscapeKeyDown={(event) => {
          if (panelDefinition) {
            event.preventDefault();
            closeEditor();
          }
        }}
      >
        <Command
          shouldFilter={false}
          value={highlighted}
          onValueChange={setHighlighted}
          onKeyDown={handleListKeyDown}
          label="Filters"
          className={cn(
            card,
            "w-(--fb-popover-width) shrink-0 rounded-lg! p-0",
            searchFocus,
            // Narrow screens: the editor replaces the list.
            panelDefinition && "max-sm:hidden",
          )}
        >
          <CommandInput
            ref={searchRef}
            autoFocus
            placeholder="Filter"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="p-1">
            {visible.length === 0 ? (
              <div role="status" className="py-6 text-center text-sm text-muted-foreground">
                No matches
              </div>
            ) : (
              visible.map((definition) => {
                const summary = getFilterSummary(definition, filters.applied[definition.id]);
                const inDialog = opensInDialog(definition);
                return (
                  <CommandItem
                    key={definition.id}
                    value={definition.id}
                    onSelect={() => openEditor(definition.id, true)}
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse") handleHover(definition);
                    }}
                    onPointerLeave={() => clearTimeout(hoverTimer.current)}
                    aria-haspopup={inDialog ? "dialog" : undefined}
                    data-open={active?.id === definition.id}
                    className={cn(rowPadding, "data-[open=true]:bg-muted")}
                  >
                    <span className="shrink-0">{definition.label}</span>
                    {summary && (
                      <>
                        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="min-w-0 truncate text-muted-foreground">
                          {summary.short}
                          <span className="sr-only"> (applied)</span>
                        </span>
                      </>
                    )}
                    {/* › marks the filters that open a side card. order-last: after the check
                        icon CommandItem appends, which already has ml-auto. */}
                    {!inDialog && (
                      <ChevronRightIcon aria-hidden className="order-last text-muted-foreground" />
                    )}
                  </CommandItem>
                );
              })
            )}
          </CommandList>
        </Command>

        {panelDefinition && (
          <div
            ref={editorPanelRef}
            role="group"
            aria-label={`${panelDefinition.label} filter`}
            onKeyDown={handleEditorKeyDown}
            className={cn(card, "flex flex-col overflow-hidden")}
          >
            <div className="p-1.5 pb-0 sm:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeEditor}
                className="gap-1 px-2 text-muted-foreground"
              >
                <ChevronLeftIcon aria-hidden />
                Back
              </Button>
            </div>
            <FilterEditorPanel
              // Remount when an editor opened by hover is then opened with the keyboard,
              // so it takes focus the same way it would have from the start.
              key={`${panelDefinition.id}:${active?.focus}`}
              definition={panelDefinition}
              editor={filters.openEditor(panelDefinition.id)}
              applyMode={filters.applyMode}
              onDone={() => handleOpenChange(false)}
              autoFocus={active?.focus}
            />
          </div>
        )}

        {dialogDefinition && (
          <FilterDialog
            open
            onOpenChange={(next) => {
              if (!next) closeEditor();
            }}
            label={dialogDefinition.label}
          >
            <TextEditor
              definition={dialogDefinition}
              editor={filters.openEditor(dialogDefinition.id)}
              applyMode={filters.applyMode}
              onDone={() => handleOpenChange(false)}
              layout="stacked"
            />
          </FilterDialog>
        )}
      </PopoverContent>
    </Popover>
  );
}
