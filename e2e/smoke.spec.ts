import { expect, test } from "@playwright/test";

for (const path of ["/", "/demo", "/customise", "/docs", "/case-study"]) {
  test(`${path} loads without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("main").first()).toBeAttached();
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("/playground is gone", async ({ page }) => {
  const response = await page.goto("/playground");
  expect(response?.status()).toBe(404);
});
