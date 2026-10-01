"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { REPO_URL } from "@/lib/links";
import { cn } from "@/lib/utils";
import { updateSiteSettings, useSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";

import { OptionsPopover } from "./controls";

const NAV = [
  { href: "/demo", label: "Demo" },
  { href: "/customise", label: "Customise" },
  { href: "/docs", label: "Docs" },
  { href: "/why", label: "Why" },
];

/**
 * A slim top bar: page-level links only. Sections within a page are in the "On this page"
 * rail, so this stays short.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const settings = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight whitespace-nowrap">
          <Logo />
          Filter Bar
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none",
                pathname === item.href && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {pathname === "/demo" && <OptionsPopover />}
          <Button asChild variant="ghost" size="icon-sm" aria-label="Source on GitHub">
            <a href={REPO_URL}>
              <GitHubMark />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => updateSiteSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
          >
            {settings.theme === "dark" ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
          </Button>
        </div>
      </div>
    </header>
  );
}

/** A tiny mark: a dashed chip and a set chip. */
function Logo() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5">
      <rect x="1.5" y="6" width="7" height="8" rx="2" fill="none" stroke="currentColor" strokeDasharray="2 1.5" opacity="0.5" />
      <rect x="10.5" y="6" width="8" height="8" rx="2" fill="var(--fb-accent)" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
