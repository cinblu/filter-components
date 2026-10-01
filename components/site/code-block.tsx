"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** A plain code block with a copy button and an optional file name. */
export function CodeBlock({
  children,
  title,
  className,
}: {
  children: string;
  title?: string;
  className?: string;
}) {
  const code = children.trim();
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-(--surface-raised)", className)}>
      {title && (
        <div className="border-b px-4 py-2 font-mono text-xs text-muted-foreground">{title}</div>
      )}
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy code"}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={cn(
          "absolute right-2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          title ? "top-1" : "top-2",
        )}
      >
        {copied ? <CheckIcon aria-hidden className="size-3.5" /> : <CopyIcon aria-hidden className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
