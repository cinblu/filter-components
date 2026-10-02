"use client";

// The customiser, laid out like a design tool: the component on a canvas, a floating toolbar
// of properties at the bottom, and the CSS in a panel on the right. Every change applies to
// the whole site, through exactly the CSS the panel shows.

import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  MoonIcon,
  PaletteIcon,
  RotateCcwIcon,
  SquareDashedIcon,
  SquareIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  overridesCss,
  updateSiteSettings,
  useSiteSettings,
} from "@/lib/site-settings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AccentControl, DensityControl, RadiusControl, UnsetStyleControl } from "@/components/site/controls";

import { DemoClient } from "../demo/demo-client";

const DENSITY_LABEL = { "0.875": "Compact", "1": "Default", "1.125": "Comfortable" } as const;
const RADIUS_LABEL = { "0": "0", "0.25rem": "4px", "0.5rem": "8px", "999px": "Pill" } as const;
const UNSET_LABEL = { dashed: "Dashed", outline: "Outline", ghost: "Ghost" } as const;

export function Customiser() {
  const settings = useSiteSettings();
  const [cssOpen, setCssOpen] = useState(true);
  const css = overridesCss(settings);

  return (
    <main className="dot-grid relative flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-(--surface-raised)">
      <h1 className="sr-only">Customise</h1>

      {/* The canvas: the component in a window, centred. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center p-4 pb-24 transition-[padding] duration-200 motion-reduce:transition-none sm:p-8 sm:pb-28",
          cssOpen && "lg:pr-[25rem]",
        )}
      >
        <div className="flex h-full max-h-[34rem] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-(--surface-stage) shadow-xl">
          <DemoClient syncUrl={false} variant="compact" className="min-h-0 flex-1" />
        </div>
      </div>

      {/* The CSS panel. */}
      {cssOpen && (
        <aside
          aria-label="CSS"
          className="absolute inset-x-4 top-4 bottom-24 z-20 flex flex-col overflow-hidden rounded-xl border bg-background shadow-xl max-lg:hidden lg:left-auto lg:w-96"
        >
          <CssPanel css={css} onClose={() => setCssOpen(false)} />
        </aside>
      )}

      {/* The floating toolbar. */}
      <div
        role="toolbar"
        aria-label="Customise"
        className="absolute bottom-6 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur-md"
      >
        <ToolButton icon={<span aria-hidden className="text-[11px] font-semibold">Aa</span>} label="Density" value={DENSITY_LABEL[settings.density]}>
          <DensityControl />
        </ToolButton>
        <ToolButton icon={<SquareIcon aria-hidden className="rounded-[3px]" />} label="Radius" value={RADIUS_LABEL[settings.radius]}>
          <RadiusControl />
        </ToolButton>
        <ToolButton icon={<SquareDashedIcon aria-hidden />} label="Unset chip" value={UNSET_LABEL[settings.unsetStyle]}>
          <UnsetStyleControl />
        </ToolButton>
        <ToolButton
          icon={<span aria-hidden className="size-3.5 rounded-full bg-(--fb-accent) ring-1 ring-foreground/10" />}
          label="Accent"
          value={settings.accent.label}
        >
          <AccentControl />
        </ToolButton>
        <Divider />
        <IconButton
          label={settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => updateSiteSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
        >
          {settings.theme === "dark" ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
        </IconButton>
        <IconButton
          label="Reset to defaults"
          onClick={() =>
            updateSiteSettings({
              density: DEFAULT_SETTINGS.density,
              radius: DEFAULT_SETTINGS.radius,
              unsetStyle: DEFAULT_SETTINGS.unsetStyle,
              accent: DEFAULT_SETTINGS.accent,
            })
          }
        >
          <RotateCcwIcon aria-hidden />
        </IconButton>
        <Divider />
        <button
          type="button"
          aria-pressed={cssOpen}
          onClick={() => setCssOpen((open) => !open)}
          className={cn(
            "hidden h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none lg:inline-flex",
            cssOpen && "bg-muted",
          )}
        >
          <CodeIcon aria-hidden className="size-3.5" />
          CSS
        </button>
        <CopyButton css={css} className="lg:hidden" />
      </div>
    </main>
  );
}

/** A toolbar item: icon, name and current value; opens its control above the toolbar. */
function ToolButton({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${value}`}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted motion-reduce:transition-none [&_svg]:size-3.5"
        >
          <span className="flex size-4 items-center justify-center text-muted-foreground">{icon}</span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={10} aria-label={label} className="w-auto gap-2 p-3">
        <p className="text-xs font-medium">{label}</p>
        {children}
      </PopoverContent>
    </Popover>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />;
}

function CopyButton({ css, className }: { css: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none",
        className,
      )}
    >
      {copied ? <CheckIcon aria-hidden className="size-3.5" /> : <CopyIcon aria-hidden className="size-3.5" />}
      {copied ? "Copied" : "Copy CSS"}
    </button>
  );
}

function CssPanel({ css, onClose }: { css: string; onClose: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <PaletteIcon aria-hidden className="size-3.5 text-muted-foreground" />
        <h2 className="text-xs font-medium">CSS</h2>
        <div className="ml-auto flex items-center gap-1">
          <CopyButton css={css} className="h-7" />
          <IconButton label="Close the CSS panel" onClick={onClose}>
            <XIcon aria-hidden />
          </IconButton>
        </div>
      </div>
      <pre
        data-testid="customiser-css"
        className="min-h-0 flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed"
      >
        <code>{css}</code>
      </pre>
      <p className="border-t px-4 py-3 text-xs text-pretty text-muted-foreground">
        Paste into your global CSS, after the Filter Bar variables the install added. Light and
        dark both covered.
      </p>
    </>
  );
}
