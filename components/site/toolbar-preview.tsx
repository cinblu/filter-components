"use client";

import { useState } from "react";

import { compactDemoFilterDefinitions } from "@/lib/demo-filters";
import { useSiteSettings } from "@/lib/site-settings";
import { FilterBar } from "@/registry/filter-bar/filter-bar";
import type { SortState } from "@/registry/filter-bar/types";
import { useFilters } from "@/registry/filter-bar/use-filters";

const PREVIEW_SORT: SortState = {
  columnId: "createdAt",
  label: "Created Date",
  direction: "desc",
  directionLabels: { asc: "Oldest first", desc: "Newest first" },
};

/**
 * A live toolbar on its own, with one filter and a sort set: enough to show both chip states
 * on a single line, without a table.
 */
export function ToolbarPreview() {
  const settings = useSiteSettings();
  const filters = useFilters({
    definitions: compactDemoFilterDefinitions,
    applyMode: settings.applyMode,
    defaultValue: { status: ["committed", "failed"] },
  });
  const [sort, setSort] = useState<SortState | undefined>(PREVIEW_SORT);

  return <FilterBar filters={filters} sort={sort} onSortChange={setSort} tooltips={settings.tooltips} />;
}
