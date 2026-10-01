"use client";

// A ghost cursor that plays the main interactions on the landing preview: open Status, tick
// two options, apply, change the sort, clear. It drives the real component (real clicks on
// real buttons), so what you see is exactly what you get.
//
// It only plays while the preview is on screen, stops the moment you move your own mouse
// over the preview, click, or press a key, runs a few loops at most, and never runs under
// prefers-reduced-motion (the parent shows a static hint instead).

import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

const START_DELAY_MS = 1200;
const MOVE_MS = 700;
const MAX_LOOPS = 3;

interface Cursor {
  x: number;
  y: number;
  visible: boolean;
  pressing: boolean;
}

class Stopped extends Error {}

export function GhostTour({
  stageRef,
  onStop,
}: {
  stageRef: RefObject<HTMLDivElement | null>;
  /** Called once when the tour ends for good (interrupted or finished). */
  onStop?: () => void;
}) {
  const [cursor, setCursor] = useState<Cursor>({ x: 0, y: 0, visible: false, pressing: false });
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onStopRef.current = onStop;
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let stopped = false;
    let visible = false;
    let openedByTour = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const stop = (reason: "interrupted" | "finished") => {
      if (stopped) return;
      stopped = true;
      timers.forEach(clearTimeout);
      setCursor((c) => ({ ...c, visible: false, pressing: false }));
      // If the tour left one of its popovers open, close it: the person is in control now.
      if (reason === "interrupted" && openedByTour && document.querySelector("[data-slot=popover-content]")) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      }
      onStopRef.current?.();
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (stopped) reject(new Stopped());
          else resolve();
        }, ms);
        timers.add(timer);
      });

    /** Waits for an element to exist (e.g. a popover that's opening). */
    const find = async <T extends Element>(query: () => T | null | undefined, timeout = 2000) => {
      const start = Date.now();
      for (;;) {
        const element = query();
        if (element) return element;
        if (Date.now() - start > timeout) throw new Stopped();
        await sleep(50);
      }
    };

    const untilVisible = async () => {
      while (!visible) await sleep(250);
    };

    const moveTo = async (element: Element, offset = { x: 0.5, y: 0.5 }) => {
      await untilVisible();
      const rect = element.getBoundingClientRect();
      setCursor((c) => ({
        ...c,
        visible: true,
        x: rect.left + rect.width * offset.x,
        y: rect.top + rect.height * offset.y,
      }));
      await sleep(MOVE_MS);
    };

    const click = async (element: HTMLElement) => {
      await moveTo(element);
      setCursor((c) => ({ ...c, pressing: true }));
      await sleep(140);
      element.click();
      setCursor((c) => ({ ...c, pressing: false }));
      await sleep(260);
    };

    const option = (dialogLabel: string, text: string) =>
      [...document.querySelectorAll<HTMLElement>(`[role=dialog][aria-label="${dialogLabel}"] [cmdk-item]`)].find(
        (item) => item.textContent?.trim() === text,
      );
    const button = (root: ParentNode, text: string) =>
      [...root.querySelectorAll<HTMLElement>("button")].find(
        (b) => b.textContent?.trim() === text && b.getAttribute("aria-hidden") !== "true",
      );

    // Focus comes back to a chip when its popover closes; with nobody at the keyboard, its
    // focus ring is just noise, so let go of it.
    const release = () => {
      if (stage.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    };

    const closePopover = async (dialogLabel: string) => {
      const dialog = document.querySelector(`[role=dialog][aria-label="${dialogLabel}"]`);
      const apply = dialog && button(dialog, "Apply");
      if (apply && !(apply as HTMLButtonElement).disabled) await click(apply);
      // Instant mode has no Apply: close the way a person would, with Escape.
      else document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await sleep(120);
      release();
    };

    const loop = async () => {
      // 1. Open Status, tick two options, apply.
      const status = await find(() => stage.querySelector<HTMLElement>('[aria-label="Add Status filter"]'));
      openedByTour = true;
      await click(status);
      await click(await find(() => option("Status filter", "Committed")));
      await click(await find(() => option("Status filter", "Failed")));
      await closePopover("Status filter");
      await sleep(900);

      // 2. Change the sort direction from the sort chip.
      const sortChip = await find(() =>
        stage.querySelector<HTMLElement>('[data-slot=sort-chip] button[aria-label^="Sorted by"]'),
      );
      await click(sortChip);
      await click(await find(() => option("Sort direction", "Oldest first")));
      release();
      await sleep(900);

      // 3. Clear the filters, and put the sort back.
      await click(await find(() => button(stage, "Clear all")));
      release();
      await sleep(500);
      await click(sortChip);
      await click(await find(() => option("Sort direction", "Newest first")));
      openedByTour = false;

      // Step away and rest before the next loop. Don't leave focus inside the preview.
      setCursor((c) => ({ ...c, visible: false }));
      await sleep(120);
      release();
      await sleep(2400);
    };

    const run = async () => {
      try {
        await sleep(START_DELAY_MS);
        // Don't take over if someone is already using the keyboard on the page.
        if (document.activeElement && document.activeElement !== document.body) throw new Stopped();
        for (let i = 0; i < MAX_LOOPS; i++) await loop();
        stop("finished");
      } catch {
        stop("interrupted");
      }
    };

    // Only play while the preview is on screen.
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0.5,
    });
    observer.observe(stage);

    // Your own mouse, a click or a key ends the tour. Synthetic events from the tour itself
    // are not "trusted", so they don't count.
    const interrupt = (event: Event) => {
      if (event.isTrusted) stop("interrupted");
    };
    stage.addEventListener("pointermove", interrupt);
    window.addEventListener("pointerdown", interrupt, true);
    window.addEventListener("keydown", interrupt, true);

    run();

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      observer.disconnect();
      stage.removeEventListener("pointermove", interrupt);
      window.removeEventListener("pointerdown", interrupt, true);
      window.removeEventListener("keydown", interrupt, true);
    };
  }, [stageRef]);

  // The cursor lives in a portal on <body>, so it only exists once we're in the browser.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return createPortal(
    <div
      aria-hidden
      data-testid="ghost-cursor"
      data-visible={cursor.visible}
      className={cn(
        "pointer-events-none fixed top-0 left-0 z-[60] transition-[transform,opacity] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
        cursor.visible ? "opacity-100" : "opacity-0",
      )}
      style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)`, transitionDuration: `${MOVE_MS}ms` }}
    >
      {/* The click ripple. */}
      <span
        className={cn(
          "absolute -top-3 -left-3 size-6 rounded-full bg-(--fb-accent)/30 transition-[transform,opacity] duration-200",
          cursor.pressing ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      />
      <svg
        viewBox="0 0 20 20"
        className={cn("relative size-5 drop-shadow-md transition-transform duration-150", cursor.pressing && "scale-90")}
      >
        <path
          d="M3.5 2.5 L3.5 16 L7.2 12.6 L9.6 18 L12 17 L9.7 11.7 L14.8 11.4 Z"
          fill="var(--foreground)"
          stroke="var(--background)"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    document.body,
  );
}
