// Static before/after sketches for the "why" page. They use the chip's real classes, so the
// "after" side looks exactly like the component; nothing here is interactive.

import { ChevronDownIcon, PlusIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { accentScope, chipBase, chipSet, chipUnset } from "@/registry/filter-bar/styles";

function Unset({ label }: { label: string }) {
  return (
    <span className={cn(chipBase, chipUnset, "gap-1 px-(--fb-chip-px)")}>
      <PlusIcon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

function Set({ label, value }: { label: string; value: string }) {
  return (
    <span className={cn(chipBase, chipSet, accentScope, "gap-1.5 px-(--fb-chip-px)")}>
      <XIcon aria-hidden className="size-3.5 text-muted-foreground" />
      {label}
      <span className="font-medium text-primary">{value}</span>
      <ChevronDownIcon aria-hidden className="-ml-0.5 size-3.5 text-primary" />
    </span>
  );
}

function OldButton({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs shadow-xs">
      <SlidersHorizontalIcon aria-hidden className="size-3.5 text-muted-foreground" />
      {children}
    </span>
  );
}

/** A side of a before/after pair. */
function Side({ label, tone, children }: { label: string; tone: "before" | "after"; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption
        className={cn(
          "text-[11px] font-medium tracking-wide uppercase",
          tone === "after" ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </figcaption>
      <div
        className={cn(
          "flex min-h-28 flex-col justify-center gap-2 rounded-lg border p-4",
          // "Before" reads as a sketch (dashed, flat); "after" as the real, raised thing.
          tone === "before" ? "border-dashed bg-transparent" : "bg-(--surface-stage) shadow-xs",
        )}
      >
        {children}
      </div>
    </figure>
  );
}

export function BeforeAfter({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Side label="Before" tone="before">
        {before}
      </Side>
      <Side label="After" tone="after">
        {after}
      </Side>
    </div>
  );
}

export const sketches = {
  hiddenFilters: {
    before: (
      <div className="flex items-center gap-2">
        <OldButton>
          Filters <span className="rounded-sm bg-muted px-1 tabular-nums">3</span>
        </OldButton>
        <span className="text-xs text-muted-foreground">Which three?</span>
      </div>
    ),
    after: (
      <div className="flex flex-wrap gap-1.5">
        <Set label="Status" value="2 items" />
        <Set label="Queue" value="Intake" />
        <Set label="Created Date" value="1 week ago" />
      </div>
    ),
  },
  invisibleSort: {
    before: (
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex gap-6 border-b pb-1.5 text-muted-foreground">
          <span>Pages</span>
          <span>Source</span>
          <span>Assignee</span>
          <span className="opacity-50">→</span>
        </div>
        <span className="text-muted-foreground">Sorted by… a column scrolled out of view</span>
      </div>
    ),
    after: (
      <div className="flex flex-wrap gap-1.5">
        <span className={cn(chipBase, chipSet, accentScope, "gap-1.5 px-(--fb-chip-px)")}>
          <XIcon aria-hidden className="size-3.5 text-muted-foreground" />
          Sort: Created Date
          <span className="font-medium text-primary">Newest first</span>
          <ChevronDownIcon aria-hidden className="-ml-0.5 size-3.5 text-primary" />
        </span>
      </div>
    ),
  },
  equalWeight: {
    before: (
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        {["Assignee", "Batch ID", "Created Date", "Document ID", "Fax Number", "Queue", "…"].map(
          (item) => (
            <span key={item} className={cn(item === "Created Date" && "text-foreground")}>
              {item}
            </span>
          ),
        )}
      </div>
    ),
    after: (
      <div className="flex flex-wrap gap-1.5">
        <Unset label="Created Date" />
        <Unset label="Status" />
        <Unset label="More Filters" />
      </div>
    ),
  },
  competingForSpace: {
    before: (
      <div className="flex flex-col gap-1.5">
        <span className="h-3 w-28 rounded-sm bg-muted" />
        <span className="h-6 w-full rounded-md border" />
        <div className="flex gap-1.5">
          <span className="h-6 w-20 rounded-md border" />
          <span className="h-6 w-20 rounded-md border" />
          <span className="h-6 w-20 rounded-md border" />
        </div>
        <span className="text-xs text-muted-foreground">Three rows before the data starts</span>
      </div>
    ),
    after: (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold">Documents</span>
          <Set label="Status" value="Open" />
          <Unset label="More Filters" />
        </div>
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 rounded-sm bg-muted" />
          ))}
        </div>
      </div>
    ),
  },
};
