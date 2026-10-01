import { expect, test } from "@playwright/test";

// SPEC §7 keyboard flow, end to end, without touching the mouse:
// ↑/↓ move, → or Enter opens the editor, ← or Escape in the editor returns to the list,
// Escape on the list closes the menu, applying in the editor closes the menu.
test("More Filters: full keyboard flow", async ({ page }) => {
  await page.goto("/playground");

  const trigger = page.getByRole("button", { name: "More Filters" });
  const menu = page.getByRole("dialog", { name: "More Filters" });
  const search = menu.getByPlaceholder("Filter");
  const workflowPanel = page.getByRole("group", { name: "Workflow filter" });
  const assigneePanel = page.getByRole("group", { name: "Assignee filter" });

  // Open the menu from the keyboard.
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(menu).toBeVisible();
  await expect(search).toBeFocused();

  // ↓ moves the highlight; → opens the highlighted filter's editor and focuses it.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowRight");
  await expect(assigneePanel).toBeVisible();
  await expect(assigneePanel.getByPlaceholder("Assignees")).toBeFocused();

  // ← returns to the list with the same item highlighted.
  await page.keyboard.press("ArrowLeft");
  await expect(assigneePanel).toBeHidden();
  await expect(search).toBeFocused();
  await expect(menu.getByRole("option", { name: /Assignee/ })).toHaveAttribute("aria-selected", "true");

  // ↑ then Enter opens Workflow; Escape inside the editor returns to the list, menu stays open.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(workflowPanel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(workflowPanel).toBeHidden();
  await expect(menu).toBeVisible();
  await expect(search).toBeFocused();

  // Search the list, open the editor, search inside it and choose: applies and closes.
  await page.keyboard.type("work");
  await expect(menu.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(workflowPanel).toBeVisible();
  await page.keyboard.type("two");
  await page.keyboard.press("Enter");

  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Workflow filter: Two-step Approval. Edit" })).toBeVisible();
  await expect(trigger).toBeFocused();

  // The applied filter shows in the menu; Escape on the list closes the menu.
  await page.keyboard.press("Enter");
  await expect(menu.getByRole("option", { name: /Workflow/ })).toContainText("Two-step Approval");
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});
