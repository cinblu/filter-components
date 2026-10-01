"use client";

import dynamic from "next/dynamic";

// The demo renders in the browser only: its data is generated relative to "today", and its
// filters live in the URL, both of which only the browser knows for certain. Rendering it on
// the server would show the wrong rows first and then swap them.
export const DemoClient = dynamic(() => import("./demo-table").then((m) => m.DemoTable), {
  ssr: false,
  loading: () => <div className="flex-1" />,
});
