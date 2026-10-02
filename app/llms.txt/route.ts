// /llms.txt: a plain-text summary for AI agents and LLM tools (https://llmstxt.org).

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `http://localhost:${process.env.PORT ?? 5000}`)
).replace(/\/$/, "");

export const dynamic = "force-static";

export function GET() {
  const body = `# Filters Framework (Filter Bar)

> A filtering framework for data-heavy products: a React filter toolbar where applied filters stay visible as chips, the active sort is a chip, important filters stay up front and the rest live in a searchable More Filters menu. Distributed as a shadcn/ui registry.

## Install

- Registry item: ${SITE}/r/filter-bar.json
- TanStack Table adapter: ${SITE}/r/filter-bar-tanstack.json
- Command: npx shadcn@latest add ${SITE}/r/filter-bar.json
- Namespaced: add "registries": { "@filters": "${SITE}/r/{name}.json" } to components.json, then npx shadcn@latest add @filters/filter-bar (also works through the shadcn MCP server).
- Requires React 19, Tailwind CSS v4 and a Radix-based shadcn style.

## Usage

- useFilters({ definitions, applyMode?, value?, onChange? }) holds applied and pending filter state.
- <FilterBar filters={filters} sort={sort} onSortChange={setSort} /> renders the toolbar.
- Filter types: multiSelect, singleSelect, dateRange (presets like "last7d", resolved at query time), text.
- useFilterUrlState(definitions) keeps filters in the URL.
- Theming: --fb-* CSS variables, --fb-accent for the accent colour.

## Docs

- [Docs](${SITE}/docs): API, filter definitions, URL sync, TanStack adapter, keyboard behaviour
- [Why it works this way](${SITE}/why): the problem, principles and design decisions
- [Demo](${SITE}/demo): 2,000-row table with every filter type
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
