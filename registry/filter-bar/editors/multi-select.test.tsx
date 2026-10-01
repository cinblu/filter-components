import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChipHarness } from "../test-utils";
import { orderSelectedFirst } from "./multi-select";

const applied = () => JSON.parse(screen.getByTestId("applied").textContent ?? "{}");
const optionNames = () =>
  screen
    .getAllByRole("option")
    .map((o) => o.textContent)
    .filter((name) => name !== "Select all");
const option = (name: string) => screen.getByRole("option", { name });
const selectAll = () => screen.getByRole("option", { name: "Select all" });
const applyButton = () => screen.getByRole("button", { name: "Apply" });

async function openQueue(defaultValue?: Record<string, string[]>, applyMode?: "manual" | "instant") {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ChipHarness defaultValue={defaultValue} applyMode={applyMode} onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /^(Add Queue filter|Queue filter:)/ }));
  return { user, onChange };
}

describe("search", () => {
  it("autofocuses the search input, with the definition's placeholder", async () => {
    await openQueue();
    const input = screen.getByPlaceholderText("Queues");
    expect(input).toHaveFocus();
  });

  it("filters options by label, case-insensitive", async () => {
    const { user } = await openQueue();
    await user.keyboard("IN");
    expect(optionNames()).toEqual(["Intake", "Billing", "Underwriting"]);
  });

  it("[T] shows 'No matches' when nothing matches", async () => {
    const { user } = await openQueue();
    await user.keyboard("zzz");
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("hides the search input for short lists (7 options or fewer)", async () => {
    const user = userEvent.setup();
    render(<ChipHarness />);
    await user.click(screen.getByRole("button", { name: "Add Status filter" }));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
  });
});

describe("[T] Select all acts on visible options only", () => {
  it("selects only the search-filtered options", async () => {
    const { user } = await openQueue({ queue: ["archive"] });
    await user.keyboard("in");
    expect(optionNames()).toEqual(["Intake", "Billing", "Underwriting"]);
    await user.click(selectAll());
    await user.click(applyButton());
    expect(new Set(applied().queue)).toEqual(new Set(["archive", "intake", "billing", "underwriting"]));
  });

  it("deselects only the visible options when they're all selected", async () => {
    const { user } = await openQueue({ queue: ["intake", "billing", "underwriting", "archive"] });
    await user.keyboard("in");
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
    await user.click(selectAll());
    await user.click(applyButton());
    expect(applied().queue).toEqual(["archive"]);
  });

  it("selects everything when there is no search", async () => {
    const { user } = await openQueue();
    await user.click(selectAll());
    for (const name of optionNames()) expect(option(name!)).toHaveAttribute("aria-checked", "true");
  });
});

describe("[T] Select all shows the indeterminate state", () => {
  it("is mixed when some, but not all, visible options are selected", async () => {
    await openQueue({ queue: ["intake"] });
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
  });

  it("is unchecked when none are selected, checked when all are", async () => {
    const { user } = await openQueue();
    expect(selectAll()).toHaveAttribute("aria-checked", "false");
    await user.click(selectAll());
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
  });

  it("only looks at visible options", async () => {
    const { user } = await openQueue({ queue: ["intake"] });
    await user.keyboard("intake");
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
  });
});

describe("[T] selected-first ordering, frozen while open", () => {
  it("moves already-selected options to the top when the editor opens, keeping their order", async () => {
    await openQueue({ queue: ["underwriting", "billing"] });
    expect(optionNames()).toEqual([
      "Billing",
      "Underwriting",
      "Intake",
      "Legal Review",
      "Claims",
      "Archive",
      "Compliance",
      "Contracts",
    ]);
  });

  it("doesn't move rows while ticking or unticking", async () => {
    const { user } = await openQueue({ queue: ["billing"] });
    const before = optionNames();
    await user.click(option("Contracts"));
    await user.click(option("Billing"));
    expect(optionNames()).toEqual(before);
  });

  it("uses the new order the next time it opens", async () => {
    const { user } = await openQueue();
    await user.click(option("Contracts"));
    await user.click(applyButton());
    await user.click(screen.getByRole("button", { name: /^(Add Queue filter|Queue filter:)/ }));
    expect(optionNames()[0]).toBe("Contracts");
  });

  it("draws a line under the options that were selected when it opened", async () => {
    const { user } = await openQueue({ queue: ["billing", "claims"] });
    const firstOther = option("Intake");
    expect(firstOther).toHaveAttribute("data-divider-above", "true");
    expect(screen.getAllByRole("option").filter((o) => o.hasAttribute("data-divider-above"))).toHaveLength(1);
    // The line stays put while ticking; it follows the order frozen at open.
    await user.click(option("Contracts"));
    expect(option("Intake")).toHaveAttribute("data-divider-above", "true");
  });

  it("draws no line when nothing, or everything, was selected", async () => {
    await openQueue();
    expect(screen.getAllByRole("option").some((o) => o.hasAttribute("data-divider-above"))).toBe(false);
  });

  it("orderSelectedFirst keeps the original relative order in both groups", () => {
    const options = ["a", "b", "c", "d"].map((value) => ({ value, label: value }));
    expect(orderSelectedFirst(options, ["d", "b"]).map((o) => o.value)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("[T] Apply is disabled when there is nothing to apply", () => {
  it("is disabled on open, enabled after a change, disabled again when changed back", async () => {
    const { user } = await openQueue({ queue: ["intake"] });
    expect(applyButton()).toBeDisabled();
    await user.click(option("Billing"));
    expect(applyButton()).toBeEnabled();
    await user.click(option("Billing"));
    expect(applyButton()).toBeDisabled();
  });

  it("Apply applies the selection and closes", async () => {
    const { user, onChange } = await openQueue();
    await user.click(option("Claims"));
    await user.click(option("Intake"));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(applyButton());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(applied()).toEqual({ queue: ["intake", "claims"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Reset clears the pending selection without applying it", async () => {
    const { user } = await openQueue({ queue: ["intake", "billing"] });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(option("Intake")).toHaveAttribute("aria-checked", "false");
    expect(applied()).toEqual({ queue: ["intake", "billing"] });
    // Applying the empty selection removes the filter.
    await user.click(applyButton());
    expect(applied()).toEqual({});
  });
});

describe("[T] keyboard and dismissal", () => {
  it("Enter applies when there is something to apply", async () => {
    const { user } = await openQueue();
    await user.click(option("Archive"));
    await user.keyboard("{Enter}");
    expect(applied()).toEqual({ queue: ["archive"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Enter does nothing when Apply is disabled", async () => {
    const { user, onChange } = await openQueue({ queue: ["intake"] });
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // And it didn't toggle the highlighted row either.
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
  });

  it("Escape discards and closes", async () => {
    const { user, onChange } = await openQueue({ queue: ["intake"] });
    await user.click(option("Claims"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(applied()).toEqual({ queue: ["intake"] });

    // The discarded edit is gone when the editor reopens.
    await user.click(screen.getByRole("button", { name: /^(Add Queue filter|Queue filter:)/ }));
    expect(option("Claims")).toHaveAttribute("aria-checked", "false");
  });

  it("clicking outside discards and closes", async () => {
    const { user, onChange } = await openQueue({ queue: ["intake"] });
    await user.click(option("Claims"));
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(applied()).toEqual({ queue: ["intake"] });
  });

  it("Space toggles the highlighted row after moving with the arrow keys", async () => {
    const { user } = await openQueue();
    await user.keyboard("{ArrowDown}"); // Select all → Intake
    await user.keyboard(" ");
    expect(option("Intake")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByPlaceholderText("Queues")).toHaveValue("");
  });

  it("Space types into the search while typing", async () => {
    const { user } = await openQueue();
    await user.keyboard("legal r");
    expect(screen.getByPlaceholderText("Queues")).toHaveValue("legal r");
    expect(optionNames()).toEqual(["Legal Review"]);
  });
});

describe("instant mode", () => {
  it("has no footer, and each toggle applies immediately", async () => {
    const { user, onChange } = await openQueue(undefined, "instant");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();

    await user.click(option("Intake"));
    expect(applied()).toEqual({ queue: ["intake"] });
    await user.click(option("Billing"));
    expect(applied()).toEqual({ queue: ["intake", "billing"] });
    expect(onChange).toHaveBeenCalledTimes(2);
    // The editor stays open for more toggles.
    expect(dialog).toBeInTheDocument();
  });

  it("Enter toggles the highlighted row", async () => {
    const { user } = await openQueue(undefined, "instant");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(applied()).toEqual({ queue: ["intake"] });
  });
});
