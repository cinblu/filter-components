// Text editor (SPEC §6.3): an input with Apply. Enter applies.
//
// Two layouts: "inline" (input and Apply side by side, in a chip's popover) and "stacked"
// (input above a right-aligned Apply, inside a "Filter by …" dialog from More Filters).
//
// The draft lives here, not in the hook's pending state, so it only applies on Apply even in
// instant mode. Applying on every keystroke would send a query per character.

"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { filterValuesEqual } from "../use-filters";
import type { FilterEditorProps } from "./filter-editor";

export function TextEditor({
  definition,
  editor,
  onDone,
  autoFocus = true,
  layout = "inline",
}: FilterEditorProps & { layout?: "inline" | "stacked" }) {
  const [initial] = useState(() => (typeof editor.pending === "string" ? editor.pending : ""));
  const [draft, setDraft] = useState(initial);
  const canApply = !filterValuesEqual(draft.trim(), initial);
  const stacked = layout === "stacked";

  return (
    <form
      className={cn(
        stacked
          ? "flex flex-col gap-3 p-4"
          : "flex w-(--fb-popover-width) items-center gap-1.5 p-1.5",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canApply) return;
        // An empty draft removes the filter.
        editor.setPending(draft.trim());
        editor.apply();
        onDone();
      }}
    >
      <Input
        autoFocus={autoFocus}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={definition.searchPlaceholder ?? definition.label}
        aria-label={definition.label}
        className="h-8 focus-visible:border-primary"
      />
      <Button type="submit" size="sm" disabled={!canApply} className={cn(stacked && "self-end")}>
        Apply
      </Button>
    </form>
  );
}
