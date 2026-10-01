"use client";

import { CheckIcon, CopyIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";

import { type Accent, DEFAULT_ACCENT, updateSiteSettings, useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { AccentPicker } from "@/components/site/accent-picker";
import { Segmented } from "@/components/site/segmented";
import { ToolbarPreview } from "@/components/site/toolbar-preview";

type Density = "0.875" | "1" | "1.125";
type Radius = "0" | "0.25rem" | "0.375rem" | "0.5rem" | "999px";
type UnsetStyle = "dashed" | "outline" | "ghost";

interface Choices {
  density: Density;
  radius: Radius;
  unsetStyle: UnsetStyle;
}

const DEFAULTS: Choices = { density: "1", radius: "0.375rem", unsetStyle: "dashed" };

/**
 * The CSS for the current choices. The page applies exactly this, so what you see is what
 * you copy. Paste it after the Filter Bar block in your global CSS.
 */
function buildCss(choices: Choices, accent: Accent): string {
  const variables = [
    `--fb-density: ${choices.density};`,
    `--fb-chip-radius: ${choices.radius};`,
    `--fb-chip-border-style: ${choices.unsetStyle === "dashed" ? "dashed" : "solid"};`,
    `--fb-chip-unset-border-color: ${choices.unsetStyle === "ghost" ? "transparent" : "var(--border)"};`,
    `--fb-accent: ${accent.light.accent};`,
    `--fb-accent-foreground: ${accent.light.foreground};`,
  ];
  const dark = [
    `--fb-accent: ${accent.dark.accent};`,
    `--fb-accent-foreground: ${accent.dark.foreground};`,
  ];
  return [
    "/* Filter Bar overrides */",
    `:root {\n  ${variables.join("\n  ")}\n}`,
    `.dark {\n  ${dark.join("\n  ")}\n}`,
    "",
  ].join("\n");
}

export function Customiser() {
  const settings = useSiteSettings();
  const [choices, setChoices] = useState<Choices>(DEFAULTS);
  const [copied, setCopied] = useState(false);
  const set = (patch: Partial<Choices>) => setChoices((prev) => ({ ...prev, ...patch }));

  const css = buildCss(choices, settings.accent);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[18rem_1fr]">
      {/* Applies the choices live, to the preview and to every popover it opens. */}
      <style>{css}</style>

      <section aria-labelledby="customise-heading" className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 id="customise-heading" className="text-xl font-semibold tracking-tight">
            Customise
          </h1>
          <p className="text-sm text-muted-foreground">
            Everything here is a CSS variable. Adjust, check the preview, then copy the CSS.
          </p>
        </div>

        <Control label="Density" variable="--fb-density">
          <Segmented
            label="Density"
            value={choices.density}
            options={[
              { value: "0.875", label: "Compact" },
              { value: "1", label: "Default" },
              { value: "1.125", label: "Comfortable" },
            ]}
            onChange={(density) => set({ density })}
          />
        </Control>

        <Control label="Chip radius" variable="--fb-chip-radius">
          <Segmented
            label="Chip radius"
            value={choices.radius}
            options={[
              { value: "0", label: "0" },
              { value: "0.25rem", label: "4" },
              { value: "0.375rem", label: "6" },
              { value: "0.5rem", label: "8" },
              { value: "999px", label: "Pill" },
            ]}
            onChange={(radius) => set({ radius })}
          />
        </Control>

        <Control label="Unset chip style" variable="--fb-chip-border-style">
          <Segmented
            label="Unset chip style"
            value={choices.unsetStyle}
            options={[
              { value: "dashed", label: "Dashed" },
              { value: "outline", label: "Outline" },
              { value: "ghost", label: "Ghost" },
            ]}
            onChange={(unsetStyle) => set({ unsetStyle })}
          />
        </Control>

        <Control label="Accent" variable="--fb-accent">
          <AccentPicker value={settings.accent} onChange={(accent) => updateSiteSettings({ accent })} />
        </Control>

        <Control label="Theme" variable=".dark">
          <Segmented
            label="Theme"
            value={settings.theme}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(theme) => updateSiteSettings({ theme })}
          />
        </Control>

        <Button
          variant="ghost"
          size="sm"
          className="self-start text-muted-foreground"
          onClick={() => {
            setChoices(DEFAULTS);
            updateSiteSettings({ accent: DEFAULT_ACCENT });
          }}
        >
          <RotateCcwIcon aria-hidden />
          Reset to defaults
        </Button>
      </section>

      <div className="flex min-w-0 flex-col gap-8">
        <section aria-labelledby="preview-heading" className="flex flex-col gap-3">
          <h2 id="preview-heading" className="text-sm font-medium">
            Preview
          </h2>
          <div className="rounded-xl border p-4 sm:p-6">
            <ToolbarPreview />
          </div>
          <p className="text-xs text-muted-foreground">
            Open a chip, the sort chip or More Filters: popovers and dialogs use the same
            variables.
          </p>
        </section>

        <section aria-labelledby="css-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="css-heading" className="text-sm font-medium">
              CSS
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(css);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
              {copied ? "Copied" : "Copy CSS"}
            </Button>
          </div>
          <pre
            data-testid="customiser-css"
            className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed"
          >
            <code>{css}</code>
          </pre>
          <p className="text-xs text-muted-foreground">
            Paste it into your global CSS, after the Filter Bar variables that the install added.
          </p>
        </section>
      </div>
    </main>
  );
}

function Control({
  label,
  variable,
  children,
}: {
  label: string;
  variable: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <code className="text-[11px] text-muted-foreground">{variable}</code>
      </div>
      {children}
    </div>
  );
}
