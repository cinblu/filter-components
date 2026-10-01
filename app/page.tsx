import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/site/code-block";
import { CopyCommand } from "@/components/site/copy-command";
import { ToolbarPreview } from "@/components/site/toolbar-preview";

import { DemoClient } from "./demo/demo-client";

// SPEC §1: the four ways filtering fails in data-heavy apps, and what this component does.
const PROBLEMS = [
  {
    problem: "People forget which filters are on, because they hide behind a “Filter (2)” button.",
    fix: "Every applied filter is a chip in the toolbar, showing its value.",
  },
  {
    problem: "Sorting disappears once the table scrolls sideways and the header is out of view.",
    fix: "The active sort is a chip too, so it stays visible.",
  },
  {
    problem: "Every filter gets equal weight, so the important ones get lost in a long list.",
    fix: "Two tiers: a few quick filters always visible; the rest in a searchable menu.",
  },
  {
    problem: "Filter controls take space away from the data they're filtering.",
    fix: "Title, search and filters share one toolbar row.",
  },
];

const USAGE = `
const filters = useFilters({ definitions });

<FilterBar
  filters={filters}
  title={<h1>Documents</h1>}
  sort={sort}
  onSortChange={setSort}
/>
`;

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16 sm:px-6 sm:py-20">
      <section className="flex max-w-2xl flex-col gap-5">
        <p className="text-sm text-muted-foreground">A shadcn registry component</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          A filter toolbar that keeps the data first
        </h1>
        <p className="text-base text-pretty text-muted-foreground">
          Applied filters stay visible, the important ones stay one click away, and the whole
          thing fits on one row above your table. Install the source into your project and
          make it yours.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/demo">
              Try the full demo
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="#install">Install</a>
          </Button>
        </div>
      </section>

      {/* The component itself, live, before anything else is explained. */}
      <div className="-mt-8 rounded-xl border p-4 sm:p-5">
        <ToolbarPreview />
      </div>

      <section aria-labelledby="why" className="flex flex-col gap-6">
        <h2 id="why" className="text-lg font-semibold tracking-tight">
          Four ways filtering goes wrong, and the fix for each
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2">
          {PROBLEMS.map(({ problem, fix }, index) => (
            <li key={problem} className="flex flex-col gap-3 bg-background p-5">
              <span className="text-xs text-muted-foreground tabular-nums">0{index + 1}</span>
              <p className="text-sm text-muted-foreground">{problem}</p>
              <p className="flex gap-2 text-sm font-medium">
                <ArrowRightIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-(--fb-accent)" />
                {fix}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="demo" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="demo" className="text-lg font-semibold tracking-tight">
            Try it
          </h2>
          <p className="text-sm text-muted-foreground">
            2,000 synthetic rows. Theme, accent, tooltips and apply mode are in{" "}
            <span className="font-medium text-foreground">Settings</span>, top right.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <DemoClient syncUrl={false} className="h-[32rem]" />
        </div>
      </section>

      <section id="install" aria-labelledby="install-heading" className="flex scroll-mt-20 flex-col gap-4">
        <h2 id="install-heading" className="text-lg font-semibold tracking-tight">
          Install
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The shadcn CLI copies the source into your project, with the shadcn components it
          uses, date-fns, lucide-react and its CSS variables. In a project set up with shadcn:
        </p>
        <CopyCommand command="npx shadcn@latest add {origin}/r/filter-bar.json" />
        <p className="text-sm text-muted-foreground">
          Using TanStack Table? Add the adapter too:
        </p>
        <CopyCommand command="npx shadcn@latest add {origin}/r/filter-bar-tanstack.json" />
        <CodeBlock className="mt-2">{USAGE}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          Everything else is in the{" "}
          <Link href="/docs" className="text-foreground underline underline-offset-4">
            docs
          </Link>
          . To match your design, try the{" "}
          <Link href="/customise" className="text-foreground underline underline-offset-4">
            customiser
          </Link>
          .
        </p>
      </section>

      <footer className="flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground">
        <p>
          Based on Nahid&apos;s article “Crafting a modular filtering framework for data-heavy
          applications”.
        </p>
        <p>
          MIT licence ·{" "}
          <a
            href="https://github.com/cinblu/filter-components"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
