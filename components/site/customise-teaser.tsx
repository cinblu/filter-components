"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { AccentControl, DensityControl, RadiusControl, UnsetStyleControl } from "./controls";
import { Frame } from "./frame";
import { ToolbarPreview } from "./toolbar-preview";

/** A property bar over a live toolbar; the full customiser is one click away. */
export function CustomiseTeaser() {
  return (
    <Frame
      stageClassName="flex min-h-40 items-center justify-center px-6 py-10"
      header={
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
          <Property label="Density">
            <DensityControl />
          </Property>
          <Property label="Radius">
            <RadiusControl />
          </Property>
          <Property label="Unset">
            <UnsetStyleControl />
          </Property>
          <Property label="Accent">
            <AccentControl />
          </Property>
        </div>
      }
      footer={
        <Link
          href="/customise"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open the customiser and copy the CSS
          <ArrowRightIcon aria-hidden className="size-3.5" />
        </Link>
      }
    >
      <ToolbarPreview />
    </Frame>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
