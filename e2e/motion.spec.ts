import { expect, test } from "@playwright/test";

// SPEC §10: chips transition in 150 ms, popovers in 120 ms, and nothing animates under
// prefers-reduced-motion: reduce.

// Runs in the browser, so it can't close over test variables.
// "off" when nothing would transition (no properties, or zero duration).
const transitionOf = (el: Element) => {
  const style = getComputedStyle(el);
  return style.transitionProperty === "none" || style.transitionDuration === "0s"
    ? "off"
    : style.transitionDuration;
};

test.describe("default motion", () => {
  test("chips take 150 ms and popovers 120 ms", async ({ page }) => {
    await page.goto("/demo?status=committed");
    const chip = page.locator("[data-slot=filter-chip]").first();
    expect(await chip.evaluate(transitionOf)).toBe("0.15s");
    await page.getByRole("button", { name: /^Status filter:/ }).click();
    const popover = page.locator("[data-slot=popover-content]");
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((el) => getComputedStyle(el).animationDuration)).toBe("0.12s");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing transitions or animates", async ({ page }) => {
    await page.goto("/demo?status=committed");
    for (const selector of [
      "[data-slot=filter-chip]",
      "[data-slot=filter-chip] > span",
      "[data-slot=filter-chip] svg",
      "[data-slot=sort-chip]",
    ]) {
      expect(await page.locator(selector).first().evaluate(transitionOf), selector).toBe("off");
    }
    await page.getByRole("button", { name: /^Status filter:/ }).click();
    const popover = page.locator("[data-slot=popover-content]");
    await expect(popover).toBeVisible();
    expect(await popover.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });
});
