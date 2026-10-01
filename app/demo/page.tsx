import type { Metadata } from "next";

import { DemoClient } from "./demo-client";

export const metadata: Metadata = {
  title: "Demo",
  description: "A 2,000-row synthetic document queue, filtered with the Filter Bar.",
};

export default function DemoPage() {
  // Fills the window below the site header; the table scrolls inside.
  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <DemoClient className="min-h-0 flex-1" />
    </main>
  );
}
