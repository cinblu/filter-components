import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { FilterBar, SEARCH_DEBOUNCE_MS } from "./filter-bar";
import { SortChip } from "./sort-chip";
import { createdAtDefinition, moreDefinitions, queueDefinition, statusDefinition } from "./test-utils";
import type { FilterState, SortState } from "./types";
import { useFilters } from "./use-filters";

const definitions = [createdAtDefinition, queueDefinition, statusDefinition, ...moreDefinitions];

function Harness({
  defaultValue,
  initialSearch = "",
  initialSort,
  onSearch,
}: {
  defaultValue?: FilterState;
  initialSearch?: string;
  initialSort?: SortState;
  onSearch?: (value: string) => void;
}) {
  const filters = useFilters({ definitions, defaultValue });
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState(initialSort);
  return (
    <>
      <FilterBar
        filters={filters}
        title={<h1>Documents</h1>}
        search={{
          value: search,
          onChange: (value) => {
            onSearch?.(value);
            setSearch(value);
          },
        }}
        sort={sort}
        onSortChange={setSort}
        resultCount={{ shown: 42, total: 1200 }}
        actions={<button type="button">Export</button>}
      />
      <output data-testid="state">{JSON.stringify({ applied: filters.applied, search, sort })}</output>
    </>
  );
}

const state = () => JSON.parse(screen.getByTestId("state").textContent ?? "{}");
const chipState = (name: RegExp) =>
  screen.getByRole("button", { name }).closest("[data-slot=filter-chip]")?.getAttribute("data-state");
const sortByDate: SortState = { columnId: "createdAt", label: "Created Date", direction: "desc" };

describe("FilterBar layout (SPEC §4)", () => {
  it("renders the slots in order: title, search, chips, More Filters, sort, Clear all, count, actions", () => {
    render(<Harness defaultValue={{ status: ["open"] }} initialSort={sortByDate} />);
    const bar = screen.getByRole("group", { name: "Filters" });
    const order = [
      screen.getByRole("heading", { name: "Documents" }),
      screen.getByRole("searchbox"),
      screen.getByRole("button", { name: "Add Created Date filter" }),
      screen.getByRole("button", { name: "Add Queue filter" }),
      screen.getByRole("button", { name: /^Status filter:/ }),
      screen.getByRole("button", { name: "More Filters" }),
      screen.getByRole("button", { name: /^Sorted by/ }),
      screen.getByRole("button", { name: "Clear all" }),
      screen.getByText("Showing 42 of 1,200"),
      screen.getByRole("button", { name: "Export" }),
    ];
    for (const element of order) expect(bar).toContainElement(element);
    for (let i = 1; i < order.length; i++) {
      // DOCUMENT_POSITION_FOLLOWING: each element comes after the previous one.
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("[T] quick filters are always rendered: dashed when unset, filled when set", () => {
    render(<Harness defaultValue={{ queue: ["intake"] }} />);
    expect(chipState(/^Add Created Date filter$/)).toBe("unset");
    expect(chipState(/^Queue filter:/)).toBe("set");
    expect(chipState(/^Add Status filter$/)).toBe("unset");
  });

  it("[T] more-tier filters render as chips only while applied", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValue={{ workflow: "redaction" }} />);
    expect(screen.getByRole("button", { name: /^Workflow filter:/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Assignee filter/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Workflow filter" }));
    expect(screen.queryByRole("button", { name: /Workflow filter/ })).not.toBeInTheDocument();

    // Back in the menu.
    await user.click(screen.getByRole("button", { name: "More Filters" }));
    expect(screen.getByRole("option", { name: /Workflow/ })).toBeInTheDocument();
  });

  it("[T] Clear all appears only when at least one filter is applied", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Created Date filter" }));
    await user.click(screen.getByRole("option", { name: "1 week ago" }));
    expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument();
  });

  it("keeps Clear all's spot while it's hidden, so the count and actions never move", () => {
    const { container } = render(<Harness />);
    const hidden = container.querySelector("button[aria-hidden=true].invisible");
    expect(hidden).toHaveTextContent("Clear all");
    expect(hidden).toHaveAttribute("tabindex", "-1");
    // It sits in the right-hand group with the count and actions, not among the filters.
    expect(hidden?.parentElement).toContainElement(screen.getByText("Showing 42 of 1,200"));
  });

  it("[T] Clear all clears filters, not the search text and not the sort", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        defaultValue={{ queue: ["intake"], batchId: "B-1" }}
        initialSearch="legal"
        initialSort={sortByDate}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(state()).toEqual({ applied: {}, search: "legal", sort: sortByDate });
    expect(screen.getByRole("searchbox")).toHaveValue("legal");
    expect(screen.getByRole("button", { name: /^Sorted by Created Date/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
  });

  it("announces the result count politely", () => {
    render(<Harness />);
    expect(screen.getByText("Showing 42 of 1,200")).toHaveAttribute("aria-live", "polite");
  });
});

describe("search", () => {
  it("applies while typing after a 300 ms pause, without Apply", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    await user.type(screen.getByRole("searchbox"), "leg");
    expect(onSearch).not.toHaveBeenCalled();
    await act(() => new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS + 50)));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("leg");
  });

  it("restarts the wait on every keystroke", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Harness onSearch={onSearch} />);
    const input = screen.getByRole("searchbox");
    await user.type(input, "a");
    await act(() => new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS - 100)));
    await user.type(input, "b");
    await act(() => new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS - 100)));
    expect(onSearch).not.toHaveBeenCalled();
    await act(() => new Promise((resolve) => setTimeout(resolve, 200)));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("ab");
  });
});

describe("SortChip (SPEC §8)", () => {
  it("renders nothing without a sort", () => {
    const { container } = render(<SortChip sort={undefined} onSortChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("reads '× Sort: Column  Direction ▾'", () => {
    render(<SortChip sort={sortByDate} onSortChange={() => {}} />);
    const chip = screen.getByRole("button", { name: "Sorted by Created Date, Descending. Change direction" });
    expect(chip).toHaveTextContent("Sort: Created DateDescending");
    const remove = screen.getByRole("button", { name: "Remove sort" });
    expect(remove.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("uses the sort's own direction words when given", () => {
    render(
      <SortChip
        sort={{ ...sortByDate, directionLabels: { asc: "Oldest first", desc: "Newest first" } }}
        onSortChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /^Sorted by/ })).toHaveTextContent("Newest first");
  });

  it("[T] clicking the chip opens a direction menu; choosing the other direction changes it", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortChip sort={sortByDate} onSortChange={onSortChange} />);
    await user.click(screen.getByRole("button", { name: /^Sorted by/ }));
    const menu = screen.getByRole("dialog", { name: "Sort direction" });
    expect(screen.getByRole("option", { name: "Descending" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("option", { name: "Ascending" }));
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ ...sortByDate, direction: "asc" });
    expect(menu).not.toBeInTheDocument();
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortChip sort={sortByDate} onSortChange={onSortChange} />);
    screen.getByRole("button", { name: /^Sorted by/ }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ ...sortByDate, direction: "asc" });
  });

  it("returns focus to the chip after choosing", async () => {
    const user = userEvent.setup();
    render(<Harness initialSort={sortByDate} />);
    await user.click(screen.getByRole("button", { name: /^Sorted by/ }));
    await user.click(screen.getByRole("option", { name: "Ascending" }));
    expect(screen.getByRole("button", { name: /^Sorted by/ })).toHaveFocus();
  });

  it("choosing the current direction just closes", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortChip sort={sortByDate} onSortChange={onSortChange} />);
    await user.click(screen.getByRole("button", { name: /^Sorted by/ }));
    await user.click(screen.getByRole("option", { name: "Descending" }));
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it("[T] × clears the sort", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<SortChip sort={sortByDate} onSortChange={onSortChange} />);
    await user.click(screen.getByRole("button", { name: "Remove sort" }));
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it("changes and clears inside the FilterBar", async () => {
    const user = userEvent.setup();
    render(<Harness initialSort={sortByDate} />);
    await user.click(screen.getByRole("button", { name: /^Sorted by/ }));
    await user.click(screen.getByRole("option", { name: "Ascending" }));
    expect(state().sort.direction).toBe("asc");
    await user.click(screen.getByRole("button", { name: "Remove sort" }));
    expect(state().sort).toBeUndefined();
    expect(screen.queryByRole("button", { name: /^Sorted by/ })).not.toBeInTheDocument();
  });
});
