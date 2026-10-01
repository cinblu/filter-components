// Picks the right editor for a filter's type. Used by chips and by the More Filters menu.

"use client";

import type { FilterDefinition } from "../types";
import type { ApplyMode, FilterEditor } from "../use-filters";
import { DateRangeEditor } from "./date-range";
import { MultiSelectEditor } from "./multi-select";
import { SingleSelectEditor } from "./single-select";
import { TextEditor } from "./text";

/** Props shared by every editor. */
export interface FilterEditorProps {
  definition: FilterDefinition;
  /** From `useFilters().openEditor(definition.id)`. */
  editor: FilterEditor;
  applyMode: ApplyMode;
  /** Called after applying, to close the popover or menu. */
  onDone: () => void;
  /**
   * Move focus into the editor when it opens. Default true. The More Filters menu turns it
   * off when an editor opens on hover, so moving the mouse doesn't steal keyboard focus.
   */
  autoFocus?: boolean;
}

export function FilterEditorPanel(props: FilterEditorProps) {
  switch (props.definition.type) {
    case "multiSelect":
      return <MultiSelectEditor {...props} />;
    case "singleSelect":
      return <SingleSelectEditor {...props} />;
    case "dateRange":
      return <DateRangeEditor {...props} />;
    case "text":
      return <TextEditor {...props} />;
  }
}
