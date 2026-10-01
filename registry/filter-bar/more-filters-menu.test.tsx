import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChipHarness, moreDefinitions, statusDefinition } from "./test-utils";
import type { FilterState } from "./types";

const applied = () => JSON.parse(screen.getByTestId("applied").textContent ?? "{}");
const menu = () => screen.getByRole("dialog", { name: "More Filters" });
// The menu's own list (the first cmdk root); editors in the side panel have their own lists.
const menuItems = () =>
  within(menu().querySelector<HTMLElement>("[cmdk-root]")!).queryAllByRole("option");
const editorPanel = (label: string) => screen.queryByRole("group", { name: `${label} filter` });

async function openMenu(defaultValue?: FilterState) {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ChipHarness
      definitions={[statusDefinition, ...moreDefinitions]}
      defaultValue={defaultValue}
      onChange={onChange}
    />,
  );
  const trigger = screen.getByRole("button", { name: "More Filters" });
  await user.click(trigger);
  return { user, onChange, trigger };
}

afterEach(() => vi.unstubAllGlobals());

describe("More Filters menu (SPEC §7)", () => {
  it("is a dashed '+ More Filters' chip that opens a searchable list of more-tier filters", async () => {
    await openMenu();
    expect(screen.getByPlaceholderText("Filter")).toHaveFocus();
    expect(menuItems().map((o) => o.firstChild?.textContent)).toEqual([
      "Workflow",
      "Assignee",
      "Source",
      "Batch ID",
    ]);
  });

  it("[T] typing filters the list by label, case-insensitive substring", async () => {
    const { user } = await openMenu();
    await user.keyboard("SIGN");
    expect(menuItems().map((o) => o.firstChild?.textContent)).toEqual(["Assignee"]);
    await user.clear(screen.getByPlaceholderText("Filter"));
    await user.keyboard("o");
    expect(menuItems().map((o) => o.firstChild?.textContent)).toEqual(["Workflow", "Source"]);
  });

  it("shows 'No matches' when nothing matches", async () => {
    const { user } = await openMenu();
    await user.keyboard("zzz");
    expect(within(menu()).getByText("No matches")).toBeInTheDocument();
  });

  it("marks applied filters with their summary", async () => {
    await openMenu({ workflow: "redaction" });
    const item = menuItems()[0];
    expect(item).toHaveTextContent("Redaction");
    expect(item).toHaveTextContent("(applied)");
    expect(menuItems()[1]).not.toHaveTextContent("(applied)");
  });

  it("opens the editor as a panel next to the list when an item is chosen", async () => {
    const { user } = await openMenu();
    await user.click(menuItems()[1]);
    const panel = editorPanel("Assignee")!;
    expect(panel).toBeInTheDocument();
    // The list stays visible next to it.
    expect(menuItems()).toHaveLength(4);
    expect(within(panel).getByRole("option", { name: "Bexa" })).toBeInTheDocument();
  });

  it("applying in the nested editor closes the whole menu and adds the chip", async () => {
    const { user, onChange, trigger } = await openMenu();
    await user.click(menuItems()[1]);
    const panel = editorPanel("Assignee")!;
    await user.click(within(panel).getByRole("option", { name: "Bexa" }));
    await user.click(within(panel).getByRole("button", { name: "Apply" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(applied()).toEqual({ assignee: ["bexa"] });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assignee filter: Bexa. Edit" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("a cleared more-tier chip goes back into the menu", async () => {
    const user = userEvent.setup();
    render(<ChipHarness definitions={[statusDefinition, ...moreDefinitions]} defaultValue={{ workflow: "standard" }} />);
    await user.click(screen.getByRole("button", { name: "Remove Workflow filter" }));
    expect(screen.queryByRole("button", { name: /Workflow filter/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More Filters" }));
    expect(menuItems()[0]).toHaveTextContent("Workflow");
    expect(menuItems()[0]).not.toHaveTextContent("(applied)");
  });

  it("the Back button returns to the list", async () => {
    const { user } = await openMenu();
    await user.click(menuItems()[0]);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(editorPanel("Workflow")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter")).toHaveFocus();
  });

  it("switching to another filter discards the first editor's unapplied changes", async () => {
    const { user } = await openMenu();
    await user.click(menuItems()[1]); // Assignee
    await user.click(within(editorPanel("Assignee")!).getByRole("option", { name: "Bexa" }));
    await user.click(menuItems()[2]); // Source
    await user.click(menuItems()[1]); // Assignee again
    expect(within(editorPanel("Assignee")!).getByRole("option", { name: "Bexa" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });
});

describe("text filters open a 'Filter by' dialog", () => {
  it("marks only side-card filters with ›", async () => {
    await openMenu();
    const [workflow, , , batch] = menuItems();
    expect(workflow.querySelector(".lucide-chevron-right")).not.toBeNull();
    expect(batch.querySelector(".lucide-chevron-right")).toBeNull();
    expect(batch).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens the dialog, applies, and closes both the dialog and the menu", async () => {
    const { user, onChange, trigger } = await openMenu();
    await user.click(menuItems()[3]);
    const dialog = screen.getByRole("dialog", { name: "Filter by Batch ID" });
    expect(within(dialog).getByRole("textbox", { name: "Batch ID" })).toHaveFocus();
    await user.keyboard("B-7{Enter}");
    expect(onChange).toHaveBeenCalledExactlyOnceWith({ batchId: "B-7" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Batch ID filter: B-7. Edit" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Escape closes only the dialog and returns to the list", async () => {
    const { user, onChange } = await openMenu();
    await user.click(menuItems()[3]);
    await user.keyboard("B-7{Escape}");
    expect(screen.queryByRole("dialog", { name: "Filter by Batch ID" })).not.toBeInTheDocument();
    expect(menu()).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter")).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("← in the dialog's input only moves the caret", async () => {
    const { user } = await openMenu();
    await user.click(menuItems()[3]);
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("dialog", { name: "Filter by Batch ID" })).toBeInTheDocument();
  });
});

describe("[T] More Filters keyboard", () => {
  it("↑/↓ move the highlight", async () => {
    const { user } = await openMenu();
    expect(menuItems()[0]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(menuItems()[2]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowUp}");
    expect(menuItems()[1]).toHaveAttribute("aria-selected", "true");
  });

  it("→ opens the highlighted filter's editor and moves focus into it", async () => {
    const { user } = await openMenu();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(editorPanel("Assignee")).toBeInTheDocument();
    expect(editorPanel("Assignee")).toContainElement(document.activeElement as HTMLElement);
  });

  it("Enter opens the highlighted filter's editor", async () => {
    const { user } = await openMenu();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(screen.getByRole("textbox", { name: "Batch ID" })).toHaveFocus();
  });

  it("→ moves the caret, not into the editor, when it isn't at the end of the search", async () => {
    const { user } = await openMenu();
    await user.keyboard("as{ArrowLeft}{ArrowRight}");
    expect(editorPanel("Assignee")).not.toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(editorPanel("Assignee")).toBeInTheDocument();
  });

  it("← inside the editor returns to the list", async () => {
    const { user } = await openMenu();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(editorPanel("Assignee")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(editorPanel("Assignee")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter")).toHaveFocus();
    // The same item is still highlighted.
    expect(menuItems()[1]).toHaveAttribute("aria-selected", "true");
  });

  it("← in a text field moves the caret until it reaches the start", async () => {
    const { user } = await openMenu();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    const search = within(editorPanel("Assignee")!).getByPlaceholderText("Assignee");
    await user.keyboard("ab{ArrowLeft}");
    expect(search).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(editorPanel("Assignee")).not.toBeInTheDocument();
  });

  it("Escape inside the editor returns to the list without closing the menu", async () => {
    const { user, onChange } = await openMenu();
    await user.keyboard("{ArrowRight}");
    expect(editorPanel("Workflow")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(editorPanel("Workflow")).not.toBeInTheDocument();
    expect(menu()).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Escape on the list closes the menu and returns focus to the trigger", async () => {
    const { user, trigger } = await openMenu();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("full flow: open, find, edit, apply — keyboard only", async () => {
    const { user } = await openMenu();
    await user.keyboard("work{ArrowRight}");
    await user.keyboard("{ArrowDown}{Enter}"); // Standard Review → Two-step Approval
    expect(applied()).toEqual({ workflow: "two-step" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("hover", () => {
  const stubWideScreen = (wide: boolean) =>
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: wide, media: query }));
  const wait = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

  it("opens the editor after a short pause, without taking focus", async () => {
    stubWideScreen(true);
    const { user } = await openMenu();
    await user.hover(menuItems()[2]);
    expect(editorPanel("Source")).not.toBeInTheDocument();
    await wait(200);
    expect(editorPanel("Source")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter")).toHaveFocus();
  });

  it("doesn't open on narrow screens", async () => {
    stubWideScreen(false);
    const { user } = await openMenu();
    await user.hover(menuItems()[2]);
    await wait(200);
    expect(editorPanel("Source")).not.toBeInTheDocument();
  });

  it("doesn't swap away from an editor with unapplied changes", async () => {
    stubWideScreen(true);
    const { user } = await openMenu();
    await user.click(menuItems()[1]); // Assignee
    await user.click(within(editorPanel("Assignee")!).getByRole("option", { name: "Bexa" }));
    await user.hover(menuItems()[2]);
    await wait(200);
    expect(editorPanel("Assignee")).toBeInTheDocument();
    expect(editorPanel("Source")).not.toBeInTheDocument();
  });
});
