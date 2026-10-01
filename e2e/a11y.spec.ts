import AxeBuilder from "@axe-core/playwright";
import { type Page, expect, test } from "@playwright/test";

// Automated accessibility check (axe), in both themes: every page, and /demo with each kind of
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
    test.use({ viewport: { width: 1280, height: 800 } });

    test.beforeEach(async ({ page }) => {
      // The site's theme is a setting (light by default), stored like the Settings menu does.
      await page.addInitScript((theme) => {
        window.localStorage.setItem("filter-bar-site-settings", JSON.stringify({ theme }));
      }, colorScheme);
    });

    for (const path of ["/", "/customise", "/docs"]) {
      test(`${path} page`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await scan(page)).toEqual([]);
      });
    }

    test.beforeEach(async ({ page }, testInfo) => {
      if (!testInfo.title.startsWith("demo")) return;
      // Filters set, so set chips and Clear all are checked too.
      await page.goto("/demo?status=committed,failed&createdAt=last7d&workflow=escalation");
      await expect(page.getByText(/^Showing [\d,]+ of 2,000$/)).toBeVisible();
      await expect(page.locator("html")).toHaveClass(colorScheme === "dark" ? /dark/ : /^(?!.*dark)/);
    });

    test("demo: page at rest", async ({ page }) => {
      expect(await scan(page)).toEqual([]);
    });

    test("demo: multi-select editor open", async ({ page }) => {
      await page.getByRole("button", { name: /^Status filter:/ }).click();
      await expect(page.getByRole("dialog", { name: "Status filter" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("demo: More Filters with an editor card open", async ({ page }) => {
      await page.getByRole("button", { name: "More Filters" }).click();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("group", { name: "Assignee filter" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("demo: custom date dialog open", async ({ page }) => {
      await page.getByRole("button", { name: /^Created Date filter:/ }).click();
      await page.getByRole("option", { name: /Custom date/ }).click();
      await expect(page.getByRole("dialog", { name: "Filter by Created Date" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });

    test("demo: sort menu open", async ({ page }) => {
      await page.getByRole("button", { name: /^Sorted by/ }).click();
      await expect(page.getByRole("dialog", { name: "Sort direction" })).toBeVisible();
      expect(await scan(page)).toEqual([]);
    });
  });
}
