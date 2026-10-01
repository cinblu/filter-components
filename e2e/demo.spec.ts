import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1100, height: 760 } });

test("filters sync to the URL and survive a reload", async ({ page }) => {
  await page.goto("/demo");
  // The count is a status line under the table: "2,000 batches" or "116 of 2,000 batches".
  const count = page.getByText(/^([\d,]+ of )?2,000 batches$/);
  await expect(count).toHaveText("2,000 batches");

  // Apply a preset and a multi-select filter.
  await page.getByRole("button", { name: "Add Created Date filter" }).click();
  await page.getByRole("option", { name: "1 month ago" }).click();
  // The table updates a moment after the toolbar (it's deferred), so wait for each new count.
  await expect(count).not.toHaveText("2,000 batches");
  const afterDate = await count.textContent();

  await page.getByRole("button", { name: "Add Status filter" }).click();
  await page.getByRole("option", { name: "Failed" }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page).toHaveURL(/\?createdAt=last1m&status=failed$/);
  await expect(count).not.toHaveText(afterDate!);
  const filtered = await count.textContent();

  // Same URL in a fresh page load: same filters, same rows.
  await page.reload();
  await expect(page.getByRole("button", { name: "Created Date filter: 1 month ago. Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Status filter: Failed. Edit" })).toBeVisible();
  await expect(count).toHaveText(filtered!);

  // Clear all empties the URL's filter params.
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(count).toHaveText("2,000 batches");
});

test("column sorting is shown as a chip that stays visible when the table scrolls sideways", async ({ page }) => {
  await page.goto("/demo");
  const sortChip = page.getByRole("button", { name: /^Sorted by/ });
  await expect(sortChip).toHaveAccessibleName("Sorted by Created Date, Newest first. Change direction");

  // Sort by Pages from its column header.
  await page.getByRole("columnheader", { name: /Pages/ }).getByRole("button").click();
  await expect(sortChip).toHaveAccessibleName(/^Sorted by Pages/);

  // Scroll the table all the way right and down; the chip is still on screen.
  const scroller = page.locator("table").locator("xpath=..");
  await scroller.evaluate((el) => el.scrollTo({ left: el.scrollWidth, top: 5000 }));
  await expect(page.getByRole("columnheader", { name: /Batch ID/ })).not.toBeInViewport();
  await expect(sortChip).toBeInViewport();

  // The chip's menu changes the direction, and the header follows.
  const header = page.getByRole("columnheader", { name: /Pages/ });
  const direction = await header.getAttribute("aria-sort");
  await sortChip.click();
  await page
    .getByRole("dialog", { name: "Sort direction" })
    .getByRole("option", { checked: false })
    .click();
  await expect(header).not.toHaveAttribute("aria-sort", direction!);

  // × removes the sort.
  await page.getByRole("button", { name: "Remove sort" }).click();
  await expect(sortChip).toHaveCount(0);
});
