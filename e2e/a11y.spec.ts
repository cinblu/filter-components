import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// Automated accessibility check (axe) on /demo, in both themes, at rest and with each kind of
// popover open. WCAG 2.1 A and AA rules, which include colour contrast.

const scan = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  // A readable failure: rule, impact, and where.
  return violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
  }));
};

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme, viewport: { width: 1280, height: 800 } });

    test.beforeEach(async ({ page }) => {
      // Filters set, so set chips and Clear all are checked too.
      await page.goto("/demo?status=committed,failed&createdAt=last7d&workflow=escalation");
      await expect(page.getByText(/^Showing [\d,]+ of 2,000$/)).toBeVisible();
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
    });

    test("page at rest", async ({ page }) => {
      expect(await scan(page)).toEqual([]);
    });

    test("multi-select editor open", async ({ page }) => {
      await page.getByRole("button", { name: /^Status filter:/ }).click();
      await expect(page.getByRole("dialog", { name: "Status filter" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("More Filters with an editor card open", async ({ page }) => {
      await page.getByRole("button", { name: "More Filters" }).click();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("group", { name: "Assignee filter" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("custom date dialog open", async ({ page }) => {
      await page.getByRole("button", { name: /^Created Date filter:/ }).click();
      await page.getByRole("option", { name: /Custom date/ }).click();
      await expect(page.getByRole("dialog", { name: "Filter by Created Date" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("sort menu open", async ({ page }) => {
      await page.getByRole("button", { name: /^Sorted by/ }).click();
      await expect(page.getByRole("dialog", { name: "Sort direction" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  });
}
