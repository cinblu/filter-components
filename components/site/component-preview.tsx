"use client";

import { ArrowUpRightIcon, CodeIcon, EyeIcon, MousePointerClickIcon } from "lucide-react";
import Link from "next/link";
import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { CodeBlock } from "./code-block";
import { GhostTour } from "./ghost-tour";
import { CommandPill } from "./install-tabs";

/**
 * The main preview: Preview / Code tabs, the install command and demo options on top, the
 * live component on a stage below, and a short "try it" hint on first view.
 */
export function ComponentPreview({ preview, code }: { preview: React.ReactNode; code: string }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div role="tablist" aria-label="Show" className="flex shrink-0 gap-0.5 rounded-lg border bg-background p-0.5 shadow-xs">
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
      </div>

      {/* A grey frame around the stage only, so the live component sits on a raised tray. */}
      <div className="rounded-2xl border bg-(--surface-raised) p-1.5">
        <div
          ref={stageRef}
          className="relative overflow-hidden rounded-xl border bg-(--surface-stage) shadow-sm"
        >
          <div id="preview-panel-preview" role="tabpanel" hidden={tab !== "preview"}>
            {preview}
          </div>
          <div id="preview-panel-code" role="tabpanel" hidden={tab !== "code"} className="p-2">
            <CodeBlock className="border-0 bg-transparent">{code}</CodeBlock>
          </div>
          {/* First view: a ghost cursor plays the main interactions. Under reduced motion, a
              static "try it" hint instead. Either way, it goes once you start interacting. */}
          {tab === "preview" && (reducedMotion ? <TryHint stageRef={stageRef} /> : <GhostTour stageRef={stageRef} />)}
        </div>
      </div>

      <Link
        href="/demo"
        className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        Open the full demo: 2,000 rows, every filter type, filters in the URL
        <ArrowUpRightIcon aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    // On the server, assume motion is fine; the browser corrects it straight after.
    () => false,
  );
}

const HINT_DELAY_MS = 800;
const HINT_VISIBLE_MS = 3600;
const HINT_EXIT_MS = 500;

/**
 * A one-off "try it" hint under the filter band, shown instead of the ghost tour when
 * reduced motion is on. It fades in shortly after load, out a few seconds later, and leaves
 * at once if you start interacting.
 */
function TryHint({ stageRef }: { stageRef: RefObject<HTMLDivElement | null> }) {
  const [phase, setPhase] = useState<"waiting" | "in" | "out" | "gone">("waiting");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("in"), HINT_DELAY_MS),
      setTimeout(() => setPhase("out"), HINT_DELAY_MS + HINT_VISIBLE_MS),
      setTimeout(() => setPhase("gone"), HINT_DELAY_MS + HINT_VISIBLE_MS + HINT_EXIT_MS),
    ];
    // Any interaction with the preview means the hint has done its job.
    const stage = stageRef.current;
    const dismiss = () => {
      timers.forEach(clearTimeout);
      setPhase((current) => (current === "in" ? "out" : "gone"));
      timers.push(setTimeout(() => setPhase("gone"), HINT_EXIT_MS));
    };
    stage?.addEventListener("pointerdown", dismiss, { once: true });
    stage?.addEventListener("keydown", dismiss, { once: true });
    return () => {
      timers.forEach(clearTimeout);
      stage?.removeEventListener("pointerdown", dismiss);
      stage?.removeEventListener("keydown", dismiss);
    };
  }, [stageRef]);

  if (phase === "gone") return null;
  const shown = phase === "in";

  return (
    <div
      aria-hidden={!shown}
      className={cn(
        "pointer-events-none absolute top-15 left-4 z-10 flex items-center gap-2 rounded-full border bg-background/95 py-1.5 pr-3.5 pl-2 text-xs font-medium shadow-lg backdrop-blur-sm",
        "transition-[opacity,filter,translate] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:blur-none motion-reduce:transition-opacity",
        shown ? "translate-y-0 opacity-100 blur-none" : "translate-y-1 opacity-0 blur-sm",
      )}
    >
      {/* The little arrow pointing up at the chips. */}
      <span
        aria-hidden
        className="absolute -top-1 left-5 size-2 rotate-45 border-t border-l bg-background"
      />
      <span className="flex size-5 items-center justify-center rounded-full bg-(--fb-accent) text-(--fb-accent-foreground)">
        <MousePointerClickIcon
          aria-hidden
          className="size-3 animate-[fb-tap_1.4s_ease-in-out_infinite] motion-reduce:animate-none"
        />
      </span>
      Try it: open a filter
    </div>
  );
}
