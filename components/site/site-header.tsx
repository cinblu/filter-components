"use client";

import { MoonIcon, SettingsIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { updateSiteSettings, useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { AccentPicker } from "./accent-picker";
import { Segmented } from "./segmented";

const NAV = [
  { href: "/demo", label: "Demo" },
  { href: "/customise", label: "Customise" },
  { href: "/docs", label: "Docs" },
];

export const SITE_HEADER_HEIGHT = "3.5rem";

export function SiteHeader() {
  const pathname = usePathname();
  const settings = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-6 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        Filter Bar
      </Link>
      <nav aria-label="Main" className="flex items-center gap-4 text-sm">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={cn(
              "text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none",
              pathname === item.href && "text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => updateSiteSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
        >
          {settings.theme === "dark" ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
        </Button>
        <SettingsPopover />
      </div>
    </header>
  );
}

/**
 * Demo settings. Each one is something a developer chooses once when using the component;
 * they're here so visitors can try them, and they apply to every demo on the site.
 */
function SettingsPopover() {
  const settings = useSiteSettings();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <SettingsIcon aria-hidden />
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Demo settings" className="w-80 gap-4 p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Demo settings</p>
          <p className="text-xs text-muted-foreground">
            In your app these are props and CSS variables, set once. Try them here.
          </p>
        </div>
        <Setting label="Theme" hint="Your app's light/dark theme">
          <Segmented
            label="Theme"
            value={settings.theme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(theme) => updateSiteSettings({ theme })}
          />
        </Setting>
        <Setting label="Accent" hint="--fb-accent (defaults to your --primary)">
          <AccentPicker value={settings.accent} onChange={(accent) => updateSiteSettings({ accent })} />
        </Setting>
        <Setting label="Tooltips" hint="<FilterBar tooltips>">
          <Segmented
            label="Tooltips"
            value={settings.tooltips ? "on" : "off"}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
            onChange={(value) => updateSiteSettings({ tooltips: value === "on" })}
          />
        </Setting>
        <Setting label="Apply" hint="useFilters({ applyMode })">
          <Segmented
            label="Apply mode"
            value={settings.applyMode}
            options={[
              { value: "manual", label: "Manual" },
              { value: "instant", label: "Instant" },
            ]}
            onChange={(applyMode) => updateSiteSettings({ applyMode })}
          />
        </Setting>
      </PopoverContent>
    </Popover>
  );
}

function Setting({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">{label}</span>
        <code className="truncate text-[11px] text-muted-foreground">{hint}</code>
      </div>
      {children}
    </div>
  );
}
