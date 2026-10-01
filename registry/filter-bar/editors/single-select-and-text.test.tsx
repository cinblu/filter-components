import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChipHarness } from "../test-utils";
import type { FilterDefinition, FilterState } from "../types";

const applied = () => JSON.parse(screen.getByTestId("applied").textContent ?? "{}");

const workflow: FilterDefinition = {
  id: "workflow",
  label: "Workflow",
  type: "singleSelect",
  tier: "quick",
  options: [
    { value: "standard", label: "Standard Review" },
    { value: "two-step", label: "Two-step Approval" },
    { value: "redaction", label: "Redaction" },
  ],
};
const batchId: FilterDefinition = { id: "batchId", label: "Batch ID", type: "text", tier: "quick" };

async function open(
  definition: FilterDefinition,
  { defaultValue, applyMode }: { defaultValue?: FilterState; applyMode?: "manual" | "instant" } = {},
) {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ChipHarness definitions={[definition]} defaultValue={defaultValue} applyMode={applyMode} onChange={onChange} />,
  );
  await user.click(
    screen.getByRole("button", { name: new RegExp(`^(Add ${definition.label} filter|${definition.label} filter:)`) }),
  );
  return { user, onChange };
}

describe("single-select editor (SPEC §6.3)", () => {
  it("choosing an option applies and closes", async () => {
    const { user, onChange } = await open(workflow);
    await user.click(screen.getByRole("option", { name: "Two-step Approval" }));
    expect(applied()).toEqual({ workflow: "two-step" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Workflow filter: Two-step Approval. Edit" })).toBeInTheDocument();
  });

  it("works with the keyboard", async () => {
    const { user } = await open(workflow);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(applied()).toEqual({ workflow: "redaction" });
  });

  it("marks the current choice", async () => {
    await open(workflow, { defaultValue: { workflow: "redaction" } });
    expect(screen.getByRole("option", { name: "Redaction" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("option", { name: "Standard Review" })).toHaveAttribute("aria-checked", "false");
  });

  it("choosing the current option again just closes", async () => {
    const { user, onChange } = await open(workflow, { defaultValue: { workflow: "redaction" } });
    await user.click(screen.getByRole("option", { name: "Redaction" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies once in instant mode", async () => {
    const { user, onChange } = await open(workflow, { applyMode: "instant" });
    await user.click(screen.getByRole("option", { name: "Standard Review" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(applied()).toEqual({ workflow: "standard" });
  });
});

describe("text editor (SPEC §6.3)", () => {
  it("focuses the input; Apply is disabled until the text changes", async () => {
    const { user } = await open(batchId);
    const input = screen.getByRole("textbox", { name: "Batch ID" });
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
    await user.keyboard("B-1");
    expect(screen.getByRole("button", { name: "Apply" })).toBeEnabled();
  });

  it("Enter applies", async () => {
    const { user, onChange } = await open(batchId);
    await user.keyboard("B-10042{Enter}");
    expect(applied()).toEqual({ batchId: "B-10042" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Apply applies, trimming spaces", async () => {
    const { user } = await open(batchId);
    await user.keyboard("  B-7  ");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(applied()).toEqual({ batchId: "B-7" });
  });

  it("applying an empty input removes the filter", async () => {
    const { user } = await open(batchId, { defaultValue: { batchId: "B-7" } });
    const input = screen.getByRole("textbox", { name: "Batch ID" });
    expect(input).toHaveValue("B-7");
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(applied()).toEqual({});
  });

  it("doesn't apply while typing in instant mode", async () => {
    const { user, onChange } = await open(batchId, { applyMode: "instant" });
    await user.keyboard("B-1");
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("Escape discards the typed text", async () => {
    const { user, onChange } = await open(batchId);
    await user.keyboard("B-1{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
