"use client";

import { CheckIcon, CopyIcon, TerminalIcon } from "lucide-react";
import { useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
// On the server there's no address yet; the browser fills in the real one straight away.
const getServerOrigin = () => "https://your-deployment.example";

/** The site's own address, so install commands point at wherever the registry is deployed. */
function useOrigin() {
  return useSyncExternalStore(subscribe, getOrigin, getServerOrigin);
}

const RUNNERS = {
  npm: "npx shadcn@latest add",
  pnpm: "pnpm dlx shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
  yarn: "yarn dlx shadcn@latest add",
} as const;
type Runner = keyof typeof RUNNERS;

/** The registry URL for an item, on whatever address the site is served from. */
export function useItemUrl(item: string) {
  return `${useOrigin()}/r/${item}.json`;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
  };
}

/** The install command with npm / pnpm / bun / yarn tabs and a copy button. */
export function InstallTabs({ item = "filter-bar" }: { item?: string }) {
  const [runner, setRunner] = useState<Runner>("npm");
  const url = useItemUrl(item);
  const command = `${RUNNERS[runner]} ${url}`;
  const { copied, copy } = useCopy();

  return (
    <div className="overflow-hidden rounded-xl border bg-(--surface-raised)">
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        <TerminalIcon aria-hidden className="mx-1 size-3.5 text-muted-foreground" />
        <div role="tablist" aria-label="Package manager" className="flex gap-0.5">
          {(Object.keys(RUNNERS) as Runner[]).map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={runner === name}
              onClick={() => setRunner(name)}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
                runner === name && "bg-background text-foreground shadow-xs",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy install command"}
          onClick={() => copy(command)}
          className="ml-auto inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {copied ? <CheckIcon aria-hidden className="size-3.5" /> : <CopyIcon aria-hidden className="size-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px]">
        <code>{command}</code>
      </pre>
    </div>
  );
}

/** A compact, one-line command with copy, for the preview header. */
export function CommandPill({ item = "filter-bar", className }: { item?: string; className?: string }) {
  const command = `npx shadcn@latest add ${useItemUrl(item)}`;
  const { copied, copy } = useCopy();
  return (
    <div
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 rounded-lg border bg-background pr-1 pl-2.5 shadow-xs",
        className,
      )}
    >
      <TerminalIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      <code className="min-w-0 flex-1 truncate font-mono text-xs" title={command}>
        {command}
      </code>
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy install command"}
        onClick={() => copy(command)}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {copied ? <CheckIcon aria-hidden className="size-3.5" /> : <CopyIcon aria-hidden className="size-3.5" />}
      </button>
    </div>
  );
}
