// Temporary page for trying components while they're built. Removed in Phase 6.
import type { Metadata } from "next";

import { Playground } from "./playground";

export const metadata: Metadata = { title: "Playground · Filter Bar" };

export default function PlaygroundPage() {
  return <Playground />;
}
