import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BotIcon,
  CheckCircle2Icon,
  KeyboardIcon,
  PaletteIcon,
  TerminalIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ARTICLE_URL, REPO_URL } from "@/lib/links";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/site/code-block";
import {
  AddRemove,
  DetailCard,
  FrozenOrder,
  OneClickDates,
  SortStaysVisible,
  TwoTiers,
} from "@/components/site/details";
import { Frame } from "@/components/site/frame";
import { CommandPill } from "@/components/site/install-tabs";
import { PageShell } from "@/components/site/page-shell";
import { ToolbarPreview } from "@/components/site/toolbar-preview";
import { BeforeAfter, sketches } from "@/components/site/why-sketches";

import { DemoClient } from "../demo/demo-client";

export const metadata: Metadata = {
  title: "Case study",
  description:
    "Crafting a modular filtering framework for data-heavy products: from a prototype across four products to an open-source, agent-ready component system.",
};

const PORTFOLIO_URL = "https://nahidnoushathu.framer.website";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "impact", label: "Impact" },
  { id: "context", label: "Context" },
  { id: "problems", label: "What went wrong" },
  { id: "principles", label: "Principles" },
  { id: "craft", label: "The craft" },
  { id: "system", label: "Component system" },
  { id: "outcome", label: "Outcome" },
];

const PROBLEMS: { title: string; body: string; sketch: keyof typeof sketches }[] = [
  {
    title: "Filters hid behind a button",
    body: "Applying one showed a count. Seeing what was on meant opening the menu again, and losing the table.",
    sketch: "hiddenFilters",
  },
  {
    title: "Sorting vanished on wide tables",
    body: "Once the sorted column scrolled away, nobody could tell how the rows were ordered.",
    sketch: "invisibleSort",
  },
  {
    title: "Every filter weighed the same",
    body: "The date range a report depends on sat in one long list with filters almost nobody used.",
    sketch: "equalWeight",
  },
  {
    title: "Controls competed with the data",
    body: "Title, search and filters each took a row before the data even started.",
    sketch: "competingForSpace",
  },
];

const AGENT_SETUP = `
// components.json: add the registry once
"registries": {
  "@filters": "https://filter-components-nu.vercel.app/r/{name}.json"
}

// then, by hand or through an AI agent with the shadcn MCP server
npx shadcn@latest add @filters/filter-bar
`;

export default function CaseStudyPage() {
  return (
    <PageShell sections={SECTIONS}>
      {/* --- Overview --------------------------------------------------------------- */}
      <section id="overview" aria-labelledby="overview-title" className="flex scroll-mt-24 flex-col gap-8">
        <a
          href={PORTFOLIO_URL}
          className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon aria-hidden className="size-3.5" />
          Portfolio
        </a>

        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">Case study · Component design · Interactions</p>
          <h1
            id="overview-title"
            className="max-w-3xl font-(family-name:--font-display) text-5xl leading-[1.05] font-normal tracking-tight text-balance sm:text-6xl"
          >
            Crafting a modular filtering framework for data-heavy products
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            One filtering pattern for four products, designed so people always see what they&apos;ve
            filtered, and now an open-source component system that people and AI agents install
            with one command.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5 text-sm sm:grid-cols-4">
          <Meta label="Role">Lead Product Designer</Meta>
          <Meta label="Timeline">2 months, 2025</Meta>
          <Meta label="Team">Product designer, front-end lead, front-end developer</Meta>
          <Meta label="Now">Open source, 2026</Meta>
        </dl>

        <Frame grid={false} stageClassName="overflow-hidden">
          <DemoClient syncUrl={false} variant="compact" focusToolbar className="h-[24rem]" />
        </Frame>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/demo">
              Try the live demo
              <ArrowUpRightIcon aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={REPO_URL}>Source on GitHub</a>
          </Button>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
          <Glance label="Problem">
            Filters hid in menus or took over the screen, so people lost track of how their data was
            filtered and sorted.
          </Glance>
          <Glance label="Solution">
            One toolbar row where every applied filter, and the sort, is a visible chip; key filters up
            front, the rest one search away.
          </Glance>
          <Glance label="Outcome">
            A single source of truth for every data table, now shipped as a tested, installable
            component system.
          </Glance>
        </div>
      </section>

      {/* --- Impact ----------------------------------------------------------------- */}
      <CaseSection id="impact" title="Impact">
        <div className="grid gap-4 sm:grid-cols-3">
          <ImpactCard figure="5×" title="Faster filtering">
            People applied and changed filters in seconds instead of minutes, in pre and post design
            reviews.
          </ImpactCard>
          <ImpactCard figure="3+" title="Products on one pattern">
            One modular system replaced each product&apos;s own filters, cutting duplicate design and
            build work, and about 40% of the back-and-forth at handoff.
          </ImpactCard>
          <ImpactCard figure="1" title="Command to install">
            The pattern now ships as an open-source component system that people, and AI agents,
            add to any shadcn project in one step.
          </ImpactCard>
        </div>
      </CaseSection>

      {/* --- Context ---------------------------------------------------------------- */}
      <CaseSection
        id="context"
        title="Context"
        lead="The same frustration showed up in the data tables of four products. Instead of four fixes, the goal was one pattern for all of them."
      >
        <ul className="flex flex-wrap gap-2">
          {["Data archival tool", "Document management system", "CRM", "Micro-video learning platform"].map(
            (product) => (
              <li key={product} className="rounded-full border bg-(--surface-raised) px-3 py-1 text-sm">
                {product}
              </li>
            ),
          )}
        </ul>
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniCard title="Prototyped in v0 first">
            A working model carried the micro-interactions static screens can&apos;t.
          </MiniCard>
          <MiniCard title="Faster buy-in">
            Stakeholders used it instead of imagining it, so approval came quickly.
          </MiniCard>
          <MiniCard title="A clearer handoff">
            Developers built from a live reference next to the Figma specs.
          </MiniCard>
        </div>
      </CaseSection>

      {/* --- What went wrong -------------------------------------------------------- */}
      <CaseSection id="problems" title="What went wrong">
        <ol className="flex flex-col gap-10">
          {PROBLEMS.map((problem, index) => (
            <li key={problem.title} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="flex items-baseline gap-3 text-lg font-medium">
                  <span className="font-(family-name:--font-display) text-2xl text-muted-foreground tabular-nums">
                    0{index + 1}
                  </span>
                  {problem.title}
                </h3>
                <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{problem.body}</p>
              </div>
              <BeforeAfter {...sketches[problem.sketch]} />
            </li>
          ))}
        </ol>
      </CaseSection>

      {/* --- Principles ------------------------------------------------------------- */}
      <CaseSection
        id="principles"
        title="Three principles"
        lead="Filtering should feel less like a panel of controls and more like a conversation with the data. Each principle below is live."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DetailCard
            className="md:col-span-2"
            title="1. Context is always on"
            why="Every applied filter is a chip with its value, and the sort is a chip too, so the state of the data is never hidden in a menu."
            stageClassName="min-h-40 px-6"
          >
            <div className="w-full">
              <ToolbarPreview />
            </div>
          </DetailCard>
          <DetailCard
            title="2. Two tiers, not one list"
            why="The one to three filters a screen depends on stay up front; the rest wait in a searchable More Filters menu."
            stageClassName="min-h-48 justify-start px-5"
          >
            <TwoTiers />
          </DetailCard>
          <DetailCard
            title="3. The data takes centre stage"
            why="Title, search, filters and sort share one row, so the space goes back to the content."
            grid={false}
          >
            <div className="w-full max-w-sm">
              <BeforeAfter {...sketches.competingForSpace} />
            </div>
          </DetailCard>
        </div>
      </CaseSection>

      {/* --- Craft ------------------------------------------------------------------ */}
      <CaseSection
        id="craft"
        title="The craft in the details"
        lead="A system feels good because of its small decisions. Try them."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DetailCard
            title="Rows never jump under your cursor"
            why="Selected options move to the top when the list opens, then stay put while you tick."
          >
            <FrozenOrder />
          </DetailCard>
          <DetailCard
            title="Humanised dates, in one click"
            why="“1 week ago”, not a calendar. Presets apply straight away and stay relative in a shared link."
          >
            <OneClickDates />
          </DetailCard>
          <DetailCard
            title="Add and remove with one control"
            why="The + turns into the × that removes the filter, and neighbours slide instead of jump."
            stageClassName="min-h-48"
          >
            <AddRemove />
          </DetailCard>
          <DetailCard
            title="Apply, for heavy tables"
            why="Refreshing a large table on every tick feels frantic. Apply keeps it calm; instant mode is there for light data. Switch it in Options, top right."
            stageClassName="min-h-48"
          >
            <p className="max-w-56 text-center text-sm text-muted-foreground">
              Every editor waits for Apply, except one-click date presets and ×.
            </p>
          </DetailCard>
          <DetailCard
            className="md:col-span-2"
            grid={false}
            title="Sort that doesn't scroll away"
            why="On a wide table the sorted column scrolls out of view; the sort chip keeps it in the toolbar."
            stageClassName="items-stretch justify-stretch p-0 overflow-hidden"
          >
            <SortStaysVisible />
          </DetailCard>
        </div>
      </CaseSection>

      {/* --- Component system ------------------------------------------------------- */}
      <CaseSection
        id="system"
        title="Now a component system, for people and agents"
        lead="The pattern started as a prototype and a Figma spec. It now ships as source anyone can install: written as a spec first, every rule tested, and ready for AI coding agents."
      >
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-4">
          <Stat figure="230+" label="unit and component tests" />
          <Stat figure="45+" label="end-to-end checks" />
          <Stat figure="AA" label="WCAG, light and dark" />
          <Stat figure="17" label="files you own and edit" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Feature icon={<TerminalIcon aria-hidden />} title="One command">
            The shadcn CLI copies the source, its dependencies and its CSS variables into your project.
          </Feature>
          <Feature icon={<BotIcon aria-hidden />} title="Agent-ready">
            A named registry and an llms.txt mean AI agents can find, install and use it through the
            shadcn MCP server.
          </Feature>
          <Feature icon={<KeyboardIcon aria-hidden />} title="Keyboard first">
            Every popover works from the keyboard, focus returns to the chip, and nothing moves for
            people who ask for reduced motion.
          </Feature>
          <Feature icon={<PaletteIcon aria-hidden />} title="Yours to restyle">
            Every size and colour is a CSS variable, with a customiser that writes the overrides.
          </Feature>
        </div>

        <div className="flex flex-col gap-3">
          <CommandPill className="h-10 max-w-2xl" />
          <CodeBlock title="For AI agents and teams">{AGENT_SETUP}</CodeBlock>
        </div>
      </CaseSection>

      {/* --- Outcome ---------------------------------------------------------------- */}
      <CaseSection id="outcome" title="Outcome">
        <blockquote className="max-w-3xl font-(family-name:--font-display) text-3xl leading-snug font-normal text-pretty">
          Clarity without clutter, and control without complexity. A filter isn&apos;t just a tool;
          it&apos;s the start of a conversation with the data.
        </blockquote>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {[
            "One pattern became the source of truth for every data table across the products.",
            "A quieter, more predictable interface let people keep their focus on the data.",
            "The work now lives on as an open-source system other teams, and their agents, can use.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-(--fb-accent)" />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/demo">
              Try the live demo
              <ArrowUpRightIcon aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={ARTICLE_URL}>
              Read the original article
              <ArrowUpRightIcon aria-hidden />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <a href={PORTFOLIO_URL}>
              <ArrowLeftIcon aria-hidden />
              Back to portfolio
            </a>
          </Button>
        </div>
      </CaseSection>
    </PageShell>
  );
}

function CaseSection({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2
          id={`${id}-title`}
          className="font-(family-name:--font-display) text-[2.5rem] leading-[1.1] font-normal tracking-tight text-balance"
        >
          {title}
        </h2>
        {lead && <p className="max-w-2xl text-base text-pretty text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-pretty">{children}</dd>
    </div>
  );
}

function Glance({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-(--surface-raised) p-5">
      <p className="text-xs font-medium tracking-wide text-(--fb-accent) uppercase">{label}</p>
      <p className="text-sm text-pretty">{children}</p>
    </div>
  );
}

function ImpactCard({ figure, title, children }: { figure: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-(--surface-raised) p-6">
      <p className="font-(family-name:--font-display) text-6xl leading-none text-(--fb-accent)">{figure}</p>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="text-sm text-pretty text-muted-foreground">{children}</p>
    </div>
  );
}

function MiniCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border bg-(--surface-raised) p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-[13px] text-pretty text-muted-foreground">{children}</p>
    </div>
  );
}

function Stat({ figure, label }: { figure: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 bg-(--surface-raised) p-5">
      <p className="font-(family-name:--font-display) text-4xl leading-none">{figure}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-(--surface-raised) p-4">
      <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-(--fb-accent) [&_svg]:size-4")}>
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-[13px] text-pretty text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
