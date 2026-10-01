import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { CodeBlock } from "@/components/site/code-block";
import { ComponentPreview } from "@/components/site/component-preview";
import { CustomiseTeaser } from "@/components/site/customise-teaser";
import { Details } from "@/components/site/details";
import { InstallTabs } from "@/components/site/install-tabs";
import { PageShell, Section } from "@/components/site/page-shell";

import { DemoClient } from "./demo/demo-client";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "The details" },
  { id: "customise", label: "Make it yours" },
  { id: "installation", label: "Installation" },
  { id: "usage", label: "Usage" },
  { id: "api", label: "API" },
];

const USAGE = `
"use client";

import { useState } from "react";

import { FilterBar } from "@/components/filter-bar/filter-bar";
import type { FilterDefinition, SortState } from "@/components/filter-bar/types";
import { useFilters } from "@/components/filter-bar/use-filters";

const definitions: FilterDefinition[] = [
  { id: "createdAt", label: "Created Date", type: "dateRange", tier: "quick" },
  {
    id: "status",
    label: "Status",
    type: "multiSelect",
    tier: "quick",
    options: [
      { value: "open", label: "Open" },
      { value: "closed", label: "Closed" },
    ],
  },
  { id: "batchId", label: "Batch ID", type: "text", tier: "more" },
];

export function Documents() {
  const filters = useFilters({ definitions });
  const [sort, setSort] = useState<SortState>();

  // filters.applied is what to filter by: send it to your API,
  // or hand it to TanStack Table with the adapter.
  return <FilterBar filters={filters} sort={sort} onSortChange={setSort} />;
}
`;

const PROPS: [string, string, string][] = [
  ["filters", "UseFiltersResult", "From useFilters({ definitions })."],
  ["sort, onSortChange", "SortState", "Shows the sort as a chip."],
  ["search", "{ value, onChange }", "Optional search, applied as you type."],
  ["title, actions", "ReactNode", "Slots at either end of the bar."],
  ["resultCount", "{ shown, total }", "Announces the result count to screen readers."],
  ["tooltips", "boolean", "Hover tooltips on chips. Default true."],
];

export default function Home() {
  return (
    <PageShell sections={SECTIONS}>
      <section id="overview" aria-labelledby="overview-title" className="flex scroll-mt-24 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">Filter Bar</p>
          <h1 id="overview-title" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A filtering framework for data-heavy products
          </h1>
          <p className="max-w-xl text-base text-pretty text-muted-foreground">
            Filters people can see, find and undo, in one row above your data. Install it with the
            shadcn CLI and make it yours.
          </p>
          <Link
            href="/why"
            className="group inline-flex items-center gap-1 self-start text-sm font-medium"
          >
            Why it works this way
            <ArrowRightIcon
              aria-hidden
              className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        </div>
        <ComponentPreview
          code={USAGE}
          preview={<DemoClient syncUrl={false} variant="compact" focusToolbar className="h-[26rem]" />}
        />
      </section>

      <Section
        id="details"
        title="The details"
        lead="Small interactions that keep filtering predictable. Each one is live; try it."
      >
        <Details />
      </Section>

      <Section
        id="customise"
        title="Make it yours"
        lead="Every size and colour is a CSS variable. Change them here and the whole site follows."
      >
        <CustomiseTeaser />
      </Section>

      <Section
        id="installation"
        title="Installation"
        lead="The shadcn CLI copies the source into your project, with the shadcn components, packages and CSS variables it needs."
      >
        <InstallTabs />
        <p className="text-sm text-muted-foreground">Filtering in the browser with TanStack Table? Add the adapter too:</p>
        <InstallTabs item="filter-bar-tanstack" />
      </Section>

      <Section id="usage" title="Usage" lead="Describe your filters, hand them to useFilters, render the bar.">
        <CodeBlock title="documents.tsx">{USAGE}</CodeBlock>
      </Section>

      <Section
        id="api"
        title="API"
        lead={
          <>
            The main props. Filter definitions, the hook, URL sync and the adapter are in the{" "}
            <Link href="/docs" className="text-foreground underline underline-offset-4">
              docs
            </Link>
            .
          </>
        }
      >
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-(--surface-raised) text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Prop</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Type</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {PROPS.map(([name, type, description]) => (
                <tr key={name} className="border-t align-top">
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

    </PageShell>
  );
}
