import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterChip, TOOLTIP_DELAY_MS } from "./filter-chip";
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

  it("set: '× Label  Value ▾', with the leading × removing the filter", () => {
    render(
      <FilterChip definition={statusDefinition} value={["open", "pending", "closed"]} onRemove={() => {}}>
        editor
      </FilterChip>,
    );
    const chip = screen.getByRole("button", { name: "Status filter: Open, Pending, Closed. Edit" });
    expect(chip).toHaveTextContent("Status3 items");
    expect(chip.closest("[data-slot=filter-chip]")).toHaveAttribute("data-state", "set");
    // The remove button comes first: the + of the unset chip, turned into a ×.
    const remove = screen.getByRole("button", { name: "Remove Status filter" });
    expect(remove.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(remove.querySelector("svg")).toHaveClass("lucide-plus", "rotate-45");
  });

  it("unset: the + is decorative (hidden from assistive tech, not in the tab order)", () => {
    const { container } = render(
      <FilterChip definition={statusDefinition} value={undefined} onRemove={() => {}}>editor</FilterChip>,
    );
    const plus = container.querySelector("button[aria-hidden=true]");
    expect(plus).toHaveAttribute("tabindex", "-1");
    expect(plus?.querySelector("svg")).not.toHaveClass("rotate-45");
  });

  it("long values are cut off by the chip's max width; the aria-label keeps the full value", () => {
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
    expect(screen.getByText(long)).toHaveClass("truncate");
    expect(chip.closest("[data-slot=filter-chip]")).toHaveClass("max-w-(--fb-chip-max-width)");
  });
});

describe("tooltips", () => {
  const waitForTooltip = () => act(() => new Promise((resolve) => setTimeout(resolve, TOOLTIP_DELAY_MS + 100)));

  it("a set chip shows its full value on hover", async () => {
    const user = userEvent.setup();
    render(<ChipHarness defaultValue={{ status: ["open", "closed"] }} />);
    await user.hover(screen.getByRole("button", { name: /^Status filter:/ }));
    await waitForTooltip();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Open, Closed");
  });

  it("an unset chip shows the definition's description", async () => {
    const user = userEvent.setup();
    render(
      <ChipHarness definitions={[{ ...statusDefinition, description: "Where the batch is in processing" }]} />,
    );
    await user.hover(screen.getByRole("button", { name: "Add Status filter" }));
    await waitForTooltip();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Where the batch is in processing");
  });

  it("doesn't show while the editor is open", async () => {
    const user = userEvent.setup();
    render(<ChipHarness defaultValue={{ status: ["open"] }} />);
    await user.click(screen.getByRole("button", { name: /^Status filter:/ }));
    await waitForTooltip();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("the chevron points up while the editor is open", async () => {
    const user = userEvent.setup();
    render(<ChipHarness defaultValue={{ status: ["open"] }} />);
    const chip = screen.getByRole("button", { name: /^Status filter:/ });
    const chevron = chip.querySelector(".lucide-chevron-down");
    expect(chevron).not.toHaveClass("rotate-180");
    await user.click(chip);
    expect(chevron).toHaveClass("rotate-180");
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
