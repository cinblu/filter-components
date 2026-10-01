"use client";

import { useState } from "react";

import { demoFilterDefinitions } from "@/lib/demo-filters";
import { useSiteSettings } from "@/lib/site-settings";
import { FilterBar } from "@/registry/filter-bar/filter-bar";
import type { SortState } from "@/registry/filter-bar/types";
import { useFilters } from "@/registry/filter-bar/use-filters";

/** A live toolbar with a few filters set, for the landing page and the customiser. */
const PREVIEW_SORT: SortState = {
  columnId: "createdAt",
  label: "Created Date",
  direction: "desc",
  directionLabels: { asc: "Oldest first", desc: "Newest first" },
};

export function ToolbarPreview() {
  const settings = useSiteSettings();
  const filters = useFilters({
    definitions: demoFilterDefinitions,
    applyMode: settings.applyMode,
    defaultValue: {
      createdAt: { kind: "preset", preset: "last7d" },
      status: ["committed", "failed"],
      workflow: "escalation",
    },
  });
  const [sort, setSort] = useState<SortState | undefined>(PREVIEW_SORT);
  const [search, setSearch] = useState("");

  return (
    <FilterBar
      filters={filters}
      title={<span className="text-sm font-semibold">Document queue</span>}
      search={{ value: search, onChange: setSearch, placeholder: "Search batches" }}
      sort={sort}
      onSortChange={setSort}
      resultCount={{ shown: 128, total: 2000 }}
      tooltips={settings.tooltips}
    />
  );
}
