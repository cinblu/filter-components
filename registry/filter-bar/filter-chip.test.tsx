import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterChip } from "./filter-chip";
import { ChipHarness, statusDefinition } from "./test-utils";

const applied = () => JSON.parse(screen.getByTestId("applied").textContent ?? "{}");

describe("[T] FilterChip states (SPEC §5)", () => {
  it("unset: a '+ Label' button with no remove button", () => {
    render(<FilterChip definition={statusDefinition} value={undefined} onRemove={() => {}}>editor</FilterChip>);
    const chip = screen.getByRole("button", { name: "Add Status filter" });
    expect(chip).toHaveTextContent("Status");
    expect(chip.closest("[data-slot=filter-chip]")).toHaveAttribute("data-state", "unset");
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });

  it("set: 'Label: summary' plus a remove button", () => {
    render(
      <FilterChip definition={statusDefinition} value={["open", "pending", "closed"]} onRemove={() => {}}>
        editor
      </FilterChip>,
    );
    const chip = screen.getByRole("button", { name: "Status filter: Open, Pending, Closed. Edit" });
    expect(chip).toHaveTextContent("Status:Open, +2");
    expect(chip).toHaveAttribute("title", "Status: Open, Pending, Closed");
    expect(chip.closest("[data-slot=filter-chip]")).toHaveAttribute("data-state", "set");
    expect(screen.getByRole("button", { name: "Remove Status filter" })).toBeInTheDocument();
  });

  it("puts the full value in title and aria-label when the summary is truncated", () => {
    const long = "A very long batch identifier value";
    render(
      <FilterChip
        definition={{ id: "batchId", label: "Batch ID", type: "text", tier: "more" }}
        value={long}
        onRemove={() => {}}
      >
        editor
      </FilterChip>,
    );
    const chip = screen.getByRole("button", { name: `Batch ID filter: ${long}. Edit` });
    expect(chip).toHaveAttribute("title", `Batch ID: ${long}`);
    expect(chip).toHaveTextContent("…");
    expect(chip).not.toHaveTextContent(long);
  });
});

describe("[T] FilterChip interactions", () => {
  it("clicking the chip body opens its editor in a popover", async () => {
    const user = userEvent.setup();
    render(<ChipHarness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Status filter" }));
    expect(screen.getByRole("dialog", { name: "Status filter" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
  });

  it("clicking × clears the filter immediately and doesn't open the editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ChipHarness defaultValue={{ status: ["open"], queue: ["intake"] }} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Remove Status filter" }));
    expect(applied()).toEqual({ queue: ["intake"] });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Status filter" })).toBeInTheDocument();
  });

  it("calls onRemove only, without opening", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <FilterChip definition={statusDefinition} value={["open"]} onRemove={onRemove} onOpenChange={onOpenChange}>
        editor
      </FilterChip>,
    );
    await user.click(screen.getByRole("button", { name: "Remove Status filter" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("[T] focus returns to the triggering chip (SPEC §10)", () => {
  it("after the editor closes with Escape", async () => {
    const user = userEvent.setup();
    render(<ChipHarness />);
    const chip = screen.getByRole("button", { name: "Add Status filter" });
    await user.click(chip);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(chip).toHaveFocus();
  });

  it("after applying", async () => {
    const user = userEvent.setup();
    render(<ChipHarness />);
    await user.click(screen.getByRole("button", { name: "Add Status filter" }));
    await user.click(screen.getByRole("option", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(screen.getByRole("button", { name: "Status filter: Open. Edit" })).toHaveFocus();
  });

  it("after removing with ×, focus stays on the chip", async () => {
    const user = userEvent.setup();
    render(<ChipHarness defaultValue={{ status: ["open"] }} />);
    await user.click(screen.getByRole("button", { name: "Remove Status filter" }));
    expect(screen.getByRole("button", { name: "Add Status filter" })).toHaveFocus();
  });
});
