"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
// On the server there's no address yet; the browser fills in the real one straight away.
const getServerOrigin = () => "https://your-deployment.example";

/** The site's own address, so install commands point at wherever the registry is deployed. */
export function useOrigin() {
  return useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
}

/** A single-line command with a copy button. `{origin}` is replaced with the site's address. */
export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const origin = useOrigin();
  const text = command.replaceAll("{origin}", origin);
  const [copied, setCopied] = useState(false);

  return (
    <div className={cn("flex items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pr-1.5 pl-3", className)}>
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap">
        <span aria-hidden className="mr-2 text-muted-foreground select-none">$</span>
        {text}
      </code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy command"}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {copied ? <CheckIcon aria-hidden className="size-3.5" /> : <CopyIcon aria-hidden className="size-3.5" />}
      </button>
    </div>
  );
}
