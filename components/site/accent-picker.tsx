"use client";

import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ACCENTS, type Accent, customAccent } from "@/lib/site-settings";

/** Accent swatches (each tuned for light and dark), plus any custom colour. */
export function AccentPicker({ value, onChange }: { value: Accent; onChange: (accent: Accent) => void }) {
  const isCustom = value.id.startsWith("custom:");
  return (
    <div role="radiogroup" aria-label="Accent colour" className="flex flex-wrap items-center gap-1.5">
      {ACCENTS.map((accent) => {
        const selected = accent.id === value.id;
        return (
          <button
            key={accent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={accent.label}
            title={accent.label}
            onClick={() => onChange(accent)}
            // Show the swatch in the colour it will have in the current theme.
            style={{ ["--swatch-light" as string]: accent.light.accent, ["--swatch-dark" as string]: accent.dark.accent }}
            className={cn(
              "flex size-6 items-center justify-center rounded-full bg-(--swatch-light) text-white outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:bg-(--swatch-dark) dark:text-black",
              selected && "ring-2 ring-foreground/40",
            )}
          >
            {selected && <CheckIcon aria-hidden className="size-3.5" />}
          </button>
        );
      })}
      <label
        title="Custom colour"
        className={cn(
          "relative flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2 text-xs text-muted-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
          isCustom && "border-foreground/40 text-foreground",
        )}
      >
        <span
          aria-hidden
          className="size-3 rounded-full border"
          style={{ background: isCustom ? value.light.accent : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
        />
        Custom
        <input
          type="color"
          aria-label="Custom accent colour"
          value={isCustom ? value.light.accent : "#2563eb"}
          onChange={(event) => onChange(customAccent(event.target.value))}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
