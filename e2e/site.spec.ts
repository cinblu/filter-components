import { expect, test } from "@playwright/test";

// The docs site: settings (theme, accent, tooltips, apply mode), the customiser's CSS, and
// the landing page's pitch and install command.

test.describe("settings", () => {
  // Even with a dark system theme, the site starts light.
  test.use({ colorScheme: "dark" });

  test("light by default; the theme toggle persists across reloads", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("accent changes --fb-accent everywhere, and persists", async ({ page }) => {
    await page.goto("/demo?status=committed");
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("radio", { name: "Violet" }).click();
    const accentOf = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--fb-accent"));
    expect(await accentOf()).toBe("oklch(0.5 0.2 295)");
    await page.reload();
    expect(await accentOf()).toBe("oklch(0.5 0.2 295)");
  });

  test("tooltips can be turned off", async ({ page }) => {
    await page.goto("/demo?status=committed,failed");
    const chip = page.getByRole("button", { name: /^Status filter:/ });
    await chip.hover();
    await expect(page.getByRole("tooltip")).toContainText("Committed, Failed");

    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("radiogroup", { name: "Tooltips" }).getByRole("radio", { name: "Off" }).click();
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 400);
    await chip.hover();
    await page.waitForTimeout(700);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });

  test("apply mode: instant applies on each tick, without an Apply button", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("radiogroup", { name: "Apply mode" }).getByRole("radio", { name: "Instant" }).click();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Add Status filter" }).click();
    const editor = page.getByRole("dialog", { name: "Status filter" });
    await expect(editor.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
    await editor.getByRole("option", { name: "Failed" }).click();
    await expect(page).toHaveURL(/status=failed/);
  });
});

test.describe("customiser", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Copy CSS gives valid CSS that sets every chosen variable", async ({ page }) => {
    await page.goto("/customise");
    await page.getByRole("radio", { name: "Compact" }).click();
    await page.getByRole("radio", { name: "Pill" }).click();
    await page.getByRole("radio", { name: "Ghost" }).click();
    await page.getByRole("radio", { name: "Blue" }).click();
    await page.getByRole("button", { name: "Copy CSS" }).click();

    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toBe(await page.getByTestId("customiser-css").textContent());

    // Paste-able: it parses as a stylesheet and sets what was chosen.
    const parsed = await page.evaluate((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return [...sheet.cssRules].map((rule) => {
        const style = (rule as CSSStyleRule).style;
        return {
          selector: (rule as CSSStyleRule).selectorText,
          vars: Object.fromEntries([...style].map((name) => [name, style.getPropertyValue(name).trim()])),
        };
      });
    }, copied);
    expect(parsed).toEqual([
      {
        selector: ":root",
        vars: {
          "--fb-density": "0.875",
          "--fb-chip-radius": "999px",
          "--fb-chip-border-style": "solid",
          "--fb-chip-unset-border-color": "transparent",
          "--fb-accent": "oklch(0.5 0.17 258)",
          "--fb-accent-foreground": "oklch(0.985 0 0)",
        },
      },
      {
        selector: ".dark",
        vars: {
          "--fb-accent": "oklch(0.74 0.13 250)",
          "--fb-accent-foreground": "oklch(0.2 0.04 258)",
        },
      },
    ]);
  });

  test("the preview uses the chosen variables live", async ({ page }) => {
    await page.goto("/customise");
    const chip = page.locator("[data-slot=filter-chip]").first();
    const heightBefore = (await chip.boundingBox())!.height;
    await page.getByRole("radio", { name: "Comfortable" }).click();
    await expect.poll(async () => (await chip.boundingBox())!.height).toBeGreaterThan(heightBefore);
  });
});

test.describe("landing page", () => {
  test("leads with the four problems, then the demo, then install", async ({ page }) => {
    await page.goto("/");
    const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
    expect(headings).toEqual([
      "Four ways filtering goes wrong, and the fix for each",
      "Try it",
      "Install",
    ]);
    await expect(page.getByRole("listitem").filter({ hasText: "Filter (2)" })).toBeVisible();
  });

  test("the install command points at this site's registry, which serves the item", async ({ page, baseURL }) => {
    await page.goto("/");
    const command = page.getByText(/npx shadcn@latest add .*\/r\/filter-bar\.json/);
    await expect(command).toContainText(`${baseURL}/r/filter-bar.json`);
    const response = await page.request.get(`${baseURL}/r/filter-bar.json`);
    expect(response.ok()).toBe(true);
    expect((await response.json()).name).toBe("filter-bar");
  });

  test("the embedded demo doesn't write filters into the landing page's URL", async ({ page }) => {
    await page.goto("/");
    const demo = page.locator("#demo").locator("xpath=../..");
    await demo.getByRole("button", { name: "Add Status filter" }).click();
    await page.getByRole("option", { name: "Failed" }).click();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(demo.getByRole("button", { name: "Status filter: Failed. Edit" })).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
  });
});
