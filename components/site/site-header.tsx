"use client";

import { HomeIcon, MoonIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";

import { REPO_URL } from "@/lib/links";
import { updateSiteSettings, useSiteSettings } from "@/lib/site-settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { OptionsPopover } from "./controls";

const NAV = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/demo", label: "Demo" },
  { href: "/customise", label: "Customise" },
  { href: "/docs", label: "Docs" },
  { href: "/why", label: "Why" },
];

/**
 * The top bar: the site title on the left, page links after it, and site-wide controls on the
 * right, with the same padding from both edges of the window. Sections within a page live in
 * the "On this page" rail, so this stays short.
 */
export function SiteHeader() {
  const settings = useSiteSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex h-14 w-full items-center gap-4 px-4 sm:gap-10 sm:px-6">
        {/* The title: a plain way home, with no hover or active state of its own. */}
        <Link
          href="/"
          aria-label="Filters Framework, home"
          className="flex shrink-0 items-center gap-2 rounded-sm font-(family-name:--font-typewriter) text-[1.0625rem] font-bold tracking-tight whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ConeIcon className="size-5 text-(--fb-accent)" />
          <span className="hidden sm:inline">Filters Framework</span>
        </Link>

        <NavLinks />

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <OptionsPopover />
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

/**
 * Page links with one underline that tracks the pointer (and keyboard focus) from link to
 * link, then settles back under the current page.
 */
function NavLinks() {
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [bar, setBar] = useState<CSSProperties>({ opacity: 0 });

  const activeIndex = NAV.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  const target = hovered ?? (activeIndex >= 0 ? activeIndex : null);

  // Measure the link the underline should sit under (layout effect: no flash at the old spot).
  useLayoutEffect(() => {
    const measure = () => {
      const link = target === null ? null : linkRefs.current[target];
      const list = listRef.current;
      if (!link || !list) return setBar((prev) => ({ ...prev, opacity: 0 }));
      setBar({
        opacity: 1,
        width: link.offsetWidth - 16,
        transform: `translateX(${link.offsetLeft - list.scrollLeft + 8}px)`,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target]);

  return (
    <nav aria-label="Main" className="relative flex h-full min-w-0 items-stretch">
      <div
        ref={listRef}
        className="flex h-full min-w-0 items-stretch overflow-x-auto [scrollbar-width:none]"
        onPointerLeave={() => setHovered(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(null);
        }}
      >
        {NAV.map((item, index) => {
          const active = index === activeIndex;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              ref={(node) => {
                linkRefs.current[index] = node;
              }}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onPointerEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:text-foreground motion-reduce:transition-none",
                active && "text-foreground",
              )}
            >
              {Icon && <Icon aria-hidden className="size-3.5" />}
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* The underline, on the header's bottom edge. */}
      <span
        aria-hidden
        style={bar}
        className="pointer-events-none absolute bottom-[-1px] left-0 h-0.5 rounded-full bg-foreground transition-[transform,width,opacity] duration-200 ease-out motion-reduce:transition-none"
      />
    </nav>
  );
}

/** Lucide's "cone". */
function ConeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m20.9 18.55-8-15.98a1 1 0 0 0-1.8 0l-8 15.98" />
      <ellipse cx="12" cy="19" rx="9" ry="3" />
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
