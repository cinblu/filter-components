import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1100, height: 760 } });

test("filters sync to the URL and survive a reload", async ({ page }) => {
  await page.goto("/demo");
  const count = page.getByText(/^Showing [\d,]+ of 2,000$/);
  await expect(count).toHaveText("Showing 2,000 of 2,000");

  // Apply a preset and a multi-select filter.
  await page.getByRole("button", { name: "Add Created Date filter" }).click();
  await page.getByRole("option", { name: "Last 30 days" }).click();
  // The table updates a moment after the toolbar (it's deferred), so wait for each new count.
  await expect(count).not.toHaveText("Showing 2,000 of 2,000");
  const afterDate = await count.textContent();

  await page.getByRole("button", { name: "Add Status filter" }).click();
  await page.getByRole("option", { name: "Failed" }).click();
  await page.getByRole("button", { name: "Apply", exact: true }).click();

  await expect(page).toHaveURL(/\?createdAt=last30d&status=failed$/);
  await expect(count).not.toHaveText(afterDate!);
  const filtered = await count.textContent();

  // Same URL in a fresh page load: same filters, same rows.
  await page.reload();
  await expect(page.getByRole("button", { name: "Created Date filter: Last 30 days. Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Status filter: Failed. Edit" })).toBeVisible();
  await expect(count).toHaveText(filtered!);

  // Clear all empties the URL's filter params.
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(count).toHaveText("Showing 2,000 of 2,000");
});

test("column sorting is shown as a chip that stays visible when the table scrolls sideways", async ({ page }) => {
  await page.goto("/demo");
  const sortChip = page.getByRole("button", { name: /^Sorted by/ });
  await expect(sortChip).toHaveAccessibleName("Sorted by Created Date, descending. Sort ascending");

  // Sort by Pages from its column header.
  await page.getByRole("columnheader", { name: /Pages/ }).getByRole("button").click();
  await expect(sortChip).toHaveAccessibleName(/^Sorted by Pages/);

  // Scroll the table all the way right and down; the chip is still on screen.
  const scroller = page.locator("table").locator("xpath=..");
  await scroller.evaluate((el) => el.scrollTo({ left: el.scrollWidth, top: 5000 }));
  await expect(page.getByRole("columnheader", { name: /Batch ID/ })).not.toBeInViewport();
  await expect(sortChip).toBeInViewport();

  // The chip flips the direction, and the header follows.
  const direction = await page.getByRole("columnheader", { name: /Pages/ }).getAttribute("aria-sort");
  await sortChip.click();
  await expect(page.getByRole("columnheader", { name: /Pages/ })).not.toHaveAttribute("aria-sort", direction!);

  // × removes the sort.
  await page.getByRole("button", { name: "Remove sort" }).click();
  await expect(sortChip).toHaveCount(0);
});
