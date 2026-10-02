import { ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { PageShell, Section } from "@/components/site/page-shell";
import { BeforeAfter, sketches } from "@/components/site/why-sketches";
import { ARTICLE_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Why it works this way",
  description:
    "The thinking behind the Filter Bar: what went wrong with filtering in four data-heavy products, and the principles and details that fixed it.",
};

const SECTIONS = [
  { id: "context", label: "Context" },
  { id: "problems", label: "What went wrong" },
  { id: "principles", label: "Principles" },
  { id: "craft", label: "The craft" },
  { id: "process", label: "Process" },
  { id: "outcome", label: "Outcome" },
];

const PROBLEMS: { title: string; body: string; sketch: keyof typeof sketches }[] = [
  {
    title: "People lost track of what was applied",
    body: "Filters lived behind one button. Applying one showed a count, so seeing what was actually on meant opening the menu again, and losing sight of the table.",
    sketch: "hiddenFilters",
  },
  {
    title: "Sorting disappeared on wide tables",
    body: "Tables scroll sideways. Once the sorted column's header left the screen, nobody could tell how the rows were ordered without scrolling back to find it.",
    sketch: "invisibleSort",
  },
  {
    title: "Every filter weighed the same",
    body: "The date range a report depends on sat in the same long, scrolling list as filters almost nobody used, so people hunted for the one they needed most.",
    sketch: "equalWeight",
  },
  {
    title: "Controls competed with the data",
    body: "Titles, search and filters each took their own row, pushing the content people came for further down the screen.",
    sketch: "competingForSpace",
  },
];

export default function WhyPage() {
  return (
    <PageShell sections={SECTIONS}>
      <header id="context" className="flex scroll-mt-24 flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">Case study</p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Why it works this way
        </h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground">
          In a data-heavy product, the biggest enemy is ambiguity: the filters meant to bring
          clarity end up hidden in menus or taking over the screen. This pattern came from four
          products with the same problem: a data archival tool, a document management system, a
          CRM and a micro-video learning platform. The goal was one filtering pattern for all of
          them that puts attention back on the data.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={ARTICLE_URL}>
              Read the full article
              <ArrowUpRightIcon aria-hidden />
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">See it working</Link>
          </Button>
        </div>
      </header>

      <Section
        id="problems"
        title="What went wrong"
        lead="Watching people use the data tables across those products showed the same frustrations each time."
      >
        <ol className="flex flex-col gap-10">
          {PROBLEMS.map((problem, index) => (
            <li key={problem.title} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="flex items-baseline gap-2 text-base font-medium">
                  <span className="text-xs text-muted-foreground tabular-nums">0{index + 1}</span>
                  {problem.title}
                </h3>
                <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{problem.body}</p>
              </div>
              <BeforeAfter {...sketches[problem.sketch]} />
            </li>
          ))}
        </ol>
      </Section>

      <Section
        id="principles"
        title="Principles"
        lead="The aim was for filtering to feel less like a rigid set of controls and more like a conversation with the data."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          <Principle title="Context is always on">
            Every applied filter becomes a chip in the toolbar, with its value, ready to remove.
            The active sort gets a chip too, so it’s visible however far the table scrolls.
          </Principle>
          <Principle title="Two tiers, not one list">
            The one to three filters a screen depends on stay up front. Everything else waits in
            a searchable More Filters menu, and shows as a chip once it’s used.
          </Principle>
          <Principle title="The data takes centre stage">
            Title, search and filters share a single toolbar row, giving the space back to the
            content and making the workspace calmer.
          </Principle>
        </ul>
      </Section>

      <Section
        id="craft"
        title="The craft"
        lead="A system feels good to use because of its details. These came from the original work; this build adds a few more."
      >
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <Detail title="Humanised dates">
            “1 week ago” and “1 month ago” are one click away instead of a calendar every time.
            They’re stored as words, not dates, so a shared link stays relative.
          </Detail>
          <Detail title="Apply, for heavy tables">
            Refreshing a large table on every tick makes the interface feel frantic. Apply keeps
            it calm; instant mode is there for small, fast data.
          </Detail>
          <Detail title="Predictable ordering">
            Selected options come to the top the next time a list opens, so reviewing choices is
            easy. While it’s open, nothing moves under the cursor.
          </Detail>
          <Detail title="One control to add and remove">
            The + of an empty chip turns into the × that clears it. Removing applies at once;
            Escape or clicking away throws unapplied edits away.
          </Detail>
          <Detail title="Keyboard first">
            Every popover works from the keyboard, focus always returns to the chip, and nothing
            animates for people who ask for reduced motion.
          </Detail>
          <Detail title="Yours to change">
            It installs as source, and every size and colour is a CSS variable, so it can match
            any product’s design system.
          </Detail>
        </dl>
      </Section>

      <Section
        id="process"
        title="Process"
        lead="The original pattern was prototyped in v0 before the Figma handoff."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          <Principle title="Show the feel">
            A working prototype carried the micro-interactions that static screens can’t.
          </Principle>
          <Principle title="Faster buy-in">
            Stakeholders could use it, not just look at it, which made approval quick.
          </Principle>
          <Principle title="A clearer handoff">
            Developers had a live reference next to the Figma specs.
          </Principle>
        </ul>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
          This open-source version takes the same pattern further: built against a written spec,
          tested rule by rule, and packaged so any team can install it.
        </p>
      </Section>

      <Section id="outcome" title="Outcome">
        <blockquote className="max-w-2xl border-l-2 border-(--fb-accent) pl-5 text-lg text-pretty">
          One modular filtering pattern became the source of truth for every data table: clarity
          without clutter, and control without complexity.
        </blockquote>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
          Making the interface quieter and more predictable lets the data speak for itself. A
          filter is the start of a conversation with the data; the job of the design is to keep
          that conversation clear.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href={ARTICLE_URL}>
              Read the full article on Medium
              <ArrowUpRightIcon aria-hidden />
            </a>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/#installation">Install it</Link>
          </Button>
        </div>
      </Section>
    </PageShell>
  );
}

function Principle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex list-none flex-col gap-1.5 rounded-xl border bg-(--surface-raised) p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-[13px] text-pretty text-muted-foreground">{children}</p>
    </li>
  );
}

function Detail({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-(--fb-accent) pl-4">
      <dt className="text-sm font-medium">{title}</dt>
      <dd className="text-[13px] text-pretty text-muted-foreground">{children}</dd>
    </div>
  );
}
