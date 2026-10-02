import type { ReactNode } from "react";

import { OnThisPage, type PageSection } from "./on-this-page";
import { SiteFooter } from "./site-footer";

/** Content on the left, the "On this page" rail on the right (wide screens). */
export function PageShell({ sections, children }: { sections: PageSection[]; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pt-10 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_10rem] xl:gap-16">
      <div className="flex min-w-0 flex-col gap-16">
        <main className="flex min-w-0 flex-col gap-16">{children}</main>
        <SiteFooter />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <OnThisPage sections={sections} />
        </div>
      </aside>
    </div>
  );
}

/** A page section with an anchor, a heading and an optional one-line lead. */
export function Section({
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
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-24 flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {lead && <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
