import type { Metadata } from "next";

import { DemoClient } from "./demo-client";

export const metadata: Metadata = {
  title: "Demo · Filter Bar",
  description: "A 2,000-row synthetic document queue, filtered with the Filter Bar.",
};

export default function DemoPage() {
  return <DemoClient />;
}
