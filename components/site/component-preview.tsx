"use client";

import { ArrowUpRightIcon, CodeIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";
import { OptionsPopover } from "./controls";
import { Frame } from "./frame";
import { CommandPill } from "./install-tabs";

/**
 * The main preview: Preview / Code tabs, the install command and demo options on the frame,
 * the live component on the stage.
 */
export function ComponentPreview({ preview, code }: { preview: React.ReactNode; code: string }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");

  return (
    <Frame
      grid={false}
      header={
        <>
          <div role="tablist" aria-label="Show" className="flex shrink-0 gap-0.5 rounded-lg border bg-background p-0.5">
            {(
              [
                { id: "preview", label: "Preview", Icon: EyeIcon },
                { id: "code", label: "Code", Icon: CodeIcon },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`preview-panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                  tab === id && "bg-secondary text-foreground",
                )}
              >
                <Icon aria-hidden className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <CommandPill className="hidden max-w-md flex-1 md:flex" />
          <div className="ml-auto flex items-center gap-1">
            <OptionsPopover />
          </div>
        </>
      }
      footer={
        <Link
          href="/demo"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open the full demo: 2,000 rows, every filter type, filters in the URL
          <ArrowUpRightIcon aria-hidden className="size-3.5" />
        </Link>
      }
    >
      <div id="preview-panel-preview" role="tabpanel" hidden={tab !== "preview"}>
        {preview}
      </div>
      <div id="preview-panel-code" role="tabpanel" hidden={tab !== "code"} className="p-2">
        <CodeBlock className="border-0 bg-transparent">{code}</CodeBlock>
      </div>
    </Frame>
  );
}
