// Shared class names, so every chip and popover in the bar looks and moves the same.
// All sizes come from the --fb-* variables (SPEC §9); colours from shadcn tokens.

/** Gap between a chip and its popover, and between the More Filters list and its panel. */
export const POPOVER_OFFSET = 8;

/** The box every chip shares: height, radius, type size, min/max width. */
export const chipBase =
  "inline-flex h-(--fb-chip-h) max-w-(--fb-chip-max-width) min-w-(--fb-chip-min-width) shrink-0 items-center rounded-(--fb-chip-radius) border text-(length:--fb-chip-font-size) whitespace-nowrap";

/**
 * Inside the filter bar, shadcn's --primary becomes the bar's own accent (--fb-accent,
 * which defaults to --primary). Buttons, checkmarks and the calendar pick it up with no
 * further changes. Applied to chips and to every popover and dialog the bar opens.
 */
export const accentScope =
  "[--primary:var(--fb-accent)] [--primary-foreground:var(--fb-accent-foreground)]";

/** Unset: dashed (or solid, or no) outline, muted text. */
export const chipUnset =
  "border-(--fb-chip-unset-border-color) text-muted-foreground [border-style:var(--fb-chip-border-style)] hover:bg-muted hover:text-foreground";

/** Set: solid outline on the background, with the value in the primary colour. */
export const chipSet = "border-border bg-background text-foreground hover:bg-muted/60";

/** Colour, border and background changes take 150 ms (SPEC §10); none with reduced motion. */
export const chipTransition =
  "transition-[background-color,border-color,color] duration-150 ease-out motion-reduce:transition-none";

/** Popover surface: 120 ms in/out (SPEC §10), no animation with reduced motion. */
export const popoverMotion = "duration-[120ms] motion-reduce:animate-none!";

/** A list row's vertical padding scales with density. */
export const rowPadding = "py-(--fb-row-py)";

/** Search inputs inside popovers get a primary-coloured border while focused. */
export const searchFocus =
  "[&_[data-slot=input-group]]:transition-colors [&_[data-slot=input-group]:has(input:focus-visible)]:border-primary";
