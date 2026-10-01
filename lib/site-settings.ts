// Settings for the docs site and its demos: theme, the filter bar's accent colour, tooltips
// and apply mode. These are things a developer sets once when using the component (a theme,
// `--fb-accent`, the `tooltips` prop, `applyMode`); the site exposes them so visitors can try
// them. Stored per browser in localStorage.

"use client";

import { useSyncExternalStore } from "react";

import type { ApplyMode } from "@/registry/filter-bar/use-filters";

export type Theme = "light" | "dark";

/** An accent colour for both themes, with a readable text colour on top of each. */
export interface Accent {
  id: string;
  label: string;
  light: { accent: string; foreground: string };
  dark: { accent: string; foreground: string };
}

const WHITE = "oklch(0.985 0 0)";

// Each light/dark pair meets WCAG AA for small text on the page and popover backgrounds.
export const ACCENTS: Accent[] = [
  {
    id: "green",
    label: "Green",
    light: { accent: "oklch(0.5 0.11 165)", foreground: WHITE },
    dark: { accent: "oklch(0.75 0.13 165)", foreground: "oklch(0.2 0.03 165)" },
  },
  {
    id: "blue",
    label: "Blue",
    light: { accent: "oklch(0.5 0.17 258)", foreground: WHITE },
    dark: { accent: "oklch(0.74 0.13 250)", foreground: "oklch(0.2 0.04 258)" },
  },
  {
    id: "violet",
    label: "Violet",
    light: { accent: "oklch(0.5 0.2 295)", foreground: WHITE },
    dark: { accent: "oklch(0.76 0.13 295)", foreground: "oklch(0.2 0.05 295)" },
  },
  {
    id: "orange",
    label: "Orange",
    light: { accent: "oklch(0.52 0.15 45)", foreground: WHITE },
    dark: { accent: "oklch(0.78 0.14 60)", foreground: "oklch(0.22 0.05 50)" },
  },
  {
    id: "neutral",
    label: "Neutral",
    light: { accent: "oklch(0.205 0 0)", foreground: WHITE },
    dark: { accent: "oklch(0.922 0 0)", foreground: "oklch(0.205 0 0)" },
  },
];

export const DEFAULT_ACCENT = ACCENTS[0];

/** Builds an accent from any hex colour, picking black or white text for contrast. */
export function customAccent(hex: string): Accent {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const foreground = luminance > 0.4 ? "oklch(0.205 0 0)" : WHITE;
  const colors = { accent: hex, foreground };
  return { id: `custom:${hex}`, label: "Custom", light: colors, dark: colors };
}

/** The CSS for an accent: what the site applies, and what the customiser's Copy CSS gives. */
export function accentCss(accent: Accent): string {
  return [
    `:root {\n  --fb-accent: ${accent.light.accent};\n  --fb-accent-foreground: ${accent.light.foreground};\n}`,
    `.dark {\n  --fb-accent: ${accent.dark.accent};\n  --fb-accent-foreground: ${accent.dark.foreground};\n}`,
  ].join("\n");
}

export interface SiteSettings {
  theme: Theme;
  accent: Accent;
  tooltips: boolean;
  applyMode: ApplyMode;
}

const DEFAULTS: SiteSettings = {
  theme: "light",
  accent: DEFAULT_ACCENT,
  tooltips: true,
  applyMode: "manual",
};

const STORAGE_KEY = "filter-bar-site-settings";
export const ACCENT_STYLE_ID = "filter-bar-accent";

// --- A tiny external store, so every page and control shares one set of settings ---------

let current: SiteSettings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load(): SiteSettings {
  if (loaded) return current;
  loaded = true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") current = { ...DEFAULTS, ...saved };
  } catch {
    // Private mode or blocked storage: use the defaults.
  }
  return current;
}

/** Applies theme and accent to the page. Also runs (inlined) before first paint. */
function applyToDocument(settings: SiteSettings) {
  const root = document.documentElement;
  root.classList.toggle("dark", settings.theme === "dark");
  let style = document.getElementById(ACCENT_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = ACCENT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = accentCss(settings.accent);
}

export function updateSiteSettings(patch: Partial<SiteSettings>) {
  current = { ...load(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Not saved; still applied for this visit.
  }
  applyToDocument(current);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSiteSettings(): SiteSettings {
  return useSyncExternalStore(subscribe, load, () => DEFAULTS);
}

/**
 * Inline script for <head>: applies the saved theme and accent before the page paints, so
 * there's no flash of the wrong theme. Light is the default.
 */
export const siteSettingsScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"null");if(!s)return;if(s.theme==="dark")document.documentElement.classList.add("dark");var a=s.accent;if(a&&a.light){var e=document.createElement("style");e.id=${JSON.stringify(
  ACCENT_STYLE_ID,
)};e.textContent=":root{--fb-accent:"+a.light.accent+";--fb-accent-foreground:"+a.light.foreground+"}.dark{--fb-accent:"+a.dark.accent+";--fb-accent-foreground:"+a.dark.foreground+"}";document.head.appendChild(e)}}catch(_){}})()`;
