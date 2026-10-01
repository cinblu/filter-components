"use client";

import { TextAlignStartIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface PageSection {
  id: string;
  label: string;
  /** Indented under the previous section. */
  sub?: boolean;
}

/**
 * The "On this page" rail. Highlights the section being read, so the page needs no other
 * section navigation.
 */
export function OnThisPage({ sections }: { sections: PageSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    // A section counts as "being read" once its top passes the upper fifth of the window.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="flex flex-col gap-3 text-[13px]">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TextAlignStartIcon aria-hidden className="size-3.5" />
        On this page
      </p>
      <ul className="relative flex flex-col border-l">
        {sections.map((section) => {
          const isActive = section.id === active;
          return (
            <li key={section.id} className="relative">
              {/* The marker on the rail for the section being read. */}
              <span
                aria-hidden
                className={cn(
                  "absolute top-1/2 -left-[3px] size-[5px] -translate-y-1/2 rounded-full bg-foreground transition-opacity duration-150 motion-reduce:transition-none",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block py-1 pl-3 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none",
                  section.sub && "pl-6",
                  isActive && "text-foreground",
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
