"use client";

// Controls bound to the shared site settings. The same control drives every place it
// appears: the preview's Options, the main page's "Make it yours", and the customiser.

import { SlidersHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  type Density,
  type Radius,
  type UnsetStyle,
  updateSiteSettings,
  useSiteSettings,
} from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { AccentPicker } from "./accent-picker";
import { Segmented } from "./segmented";

export function DensityControl() {
  const { density } = useSiteSettings();
  return (
    <Segmented<Density>
      label="Density"
      value={density}
      options={[
        { value: "0.875", label: "Compact" },
        { value: "1", label: "Default" },
        { value: "1.125", label: "Comfortable" },
      ]}
      onChange={(value) => updateSiteSettings({ density: value })}
    />
  );
}

export function RadiusControl() {
  const { radius } = useSiteSettings();
  return (
    <Segmented<Radius>
      label="Chip radius"
      value={radius}
      options={[
        { value: "0", label: "0" },
        { value: "0.25rem", label: "4" },
        { value: "0.375rem", label: "6" },
        { value: "0.5rem", label: "8" },
        { value: "999px", label: "Pill" },
      ]}
      onChange={(value) => updateSiteSettings({ radius: value })}
    />
  );
}

export function UnsetStyleControl() {
  const { unsetStyle } = useSiteSettings();
  return (
    <Segmented<UnsetStyle>
      label="Unset chip style"
      value={unsetStyle}
      options={[
        { value: "dashed", label: "Dashed" },
        { value: "outline", label: "Outline" },
        { value: "ghost", label: "Ghost" },
      ]}
      onChange={(value) => updateSiteSettings({ unsetStyle: value })}
    />
  );
}

export function AccentControl() {
  const { accent } = useSiteSettings();
  return <AccentPicker value={accent} onChange={(value) => updateSiteSettings({ accent: value })} />;
}

export function ThemeControl() {
  const { theme } = useSiteSettings();
  return (
    <Segmented
      label="Theme"
      value={theme}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
      onChange={(value) => updateSiteSettings({ theme: value })}
    />
  );
}

export function TooltipsControl() {
  const { tooltips } = useSiteSettings();
  return (
    <Segmented
      label="Tooltips"
      value={tooltips ? "on" : "off"}
      options={[
        { value: "on", label: "On" },
        { value: "off", label: "Off" },
      ]}
      onChange={(value) => updateSiteSettings({ tooltips: value === "on" })}
    />
  );
}

export function ApplyModeControl() {
  const { applyMode } = useSiteSettings();
  return (
    <Segmented
      label="Apply mode"
      value={applyMode}
      options={[
        { value: "manual", label: "Manual" },
        { value: "instant", label: "Instant" },
      ]}
      onChange={(value) => updateSiteSettings({ applyMode: value })}
    />
  );
}

/** A labelled row: the setting's name, the code it maps to, and its control. */
export function ControlRow({
  label,
  code,
  children,
  className,
}: {
  label: string;
  code: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium">{label}</span>
        <code className="truncate font-mono text-[11px] text-muted-foreground">{code}</code>
      </div>
      {children}
    </div>
  );
}

/**
 * Behaviour options for the demos. Each is something a developer sets once in code; they're
 * here to try, and kept apart from the filter bar itself.
 */
export function OptionsPopover({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5 text-muted-foreground", className)}>
          <SlidersHorizontalIcon aria-hidden />
          Options
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Demo options" className="w-80 gap-4 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Demo options</p>
          <p className="text-xs text-muted-foreground">
            In your app these are props and CSS variables, set once.
          </p>
        </div>
        <ControlRow label="Apply" code="useFilters({ applyMode })">
          <ApplyModeControl />
        </ControlRow>
        <ControlRow label="Tooltips" code="<FilterBar tooltips>">
          <TooltipsControl />
        </ControlRow>
        <ControlRow label="Accent" code="--fb-accent">
          <AccentControl />
        </ControlRow>
      </PopoverContent>
    </Popover>
  );
}
