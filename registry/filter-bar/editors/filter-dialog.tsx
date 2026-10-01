// "Filter by {label}" modal. Used where an editor needs more room or focus than a popover:
// the custom date calendar, and text filters opened from the More Filters menu.
//
// It's rendered from inside the popover that opened it, so Radix treats it as a nested layer:
// Escape or ✕ closes only the dialog and returns to the popover underneath; applying closes
// both.

"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import { accentScope, popoverMotion } from "../styles";

export interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The filter's label; the title reads "Filter by {label}". */
  label: string;
  children: ReactNode;
  className?: string;
}

export function FilterDialog({ open, onOpenChange, label, children, className }: FilterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("gap-0 p-0 sm:max-w-md", accentScope, popoverMotion, className)}>
        <div className="border-b px-4 py-3 pr-10">
          <DialogTitle className="text-sm font-medium">Filter by {label}</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a value for the {label} filter, then apply it.
          </DialogDescription>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
