"use client";

import { cn } from "@/lib/utils";

/** A small set of mutually exclusive buttons (a segmented control). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-md border bg-background p-0.5 text-xs", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-sm px-2.5 py-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
            value === option.value && "bg-secondary text-secondary-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
