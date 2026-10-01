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
    await page.getByRole("button", { name: "Options" }).click();
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

    await page.getByRole("button", { name: "Options" }).click();
    await page.getByRole("radiogroup", { name: "Tooltips" }).getByRole("radio", { name: "Off" }).click();
    await page.keyboard.press("Escape");
    await page.mouse.move(0, 400);
    await chip.hover();
    await page.waitForTimeout(700);
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });

  test("apply mode: instant applies on each tick, without an Apply button", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: "Options" }).click();
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
    const toolbar = page.getByRole("toolbar", { name: "Customise" });
    // Each toolbar item opens its control above the toolbar.
    const choose = async (item: RegExp, option: string) => {
      await toolbar.getByRole("button", { name: item }).click();
      await page.getByRole("radio", { name: option }).click();
      await page.keyboard.press("Escape");
    };
    await choose(/^Density/, "Compact");
    await choose(/^Radius/, "Pill");
    await choose(/^Unset chip/, "Ghost");
    await choose(/^Accent/, "Blue");
    await page.getByRole("complementary", { name: "CSS" }).getByRole("button", { name: "Copy CSS" }).click();

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
    await page.getByRole("toolbar", { name: "Customise" }).getByRole("button", { name: /^Density/ }).click();
    await page.getByRole("radio", { name: "Comfortable" }).click();
    await expect.poll(async () => (await chip.boundingBox())!.height).toBeGreaterThan(heightBefore);
  });
});

test.describe("main page", () => {
  test("reads like a component page: overview, details, customise, install, usage, API", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Filter Bar");
    expect(await page.getByRole("heading", { level: 2 }).allTextContents()).toEqual([
      "The details",
      "Make it yours",
      "Installation",
      "Usage",
      "API",
    ]);
    const rail = page.getByRole("navigation", { name: "On this page" });
    await expect(rail.getByRole("link")).toHaveText([
      "Overview",
      "The details",
      "Make it yours",
      "Installation",
      "Usage",
      "API",
    ]);
  });

  test("loads at the top: inline editors don't scroll the page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the rail follows the section being read", async ({ page }) => {
    await page.goto("/");
    await page.locator("#installation").scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById("installation")!.scrollIntoView());
    await expect(
      page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Installation" }),
    ).toHaveAttribute("aria-current", "location");
  });

  test("install commands point at this site's registry, which serves the item", async ({ page, baseURL }) => {
    await page.goto("/");
    const url = `${baseURL}/r/filter-bar.json`;
    await expect(page.locator("#installation pre").first()).toHaveText(`npx shadcn@latest add ${url}`);
    await page.locator("#installation").getByRole("tab", { name: "pnpm" }).first().click();
    await expect(page.locator("#installation pre").first()).toHaveText(`pnpm dlx shadcn@latest add ${url}`);
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    expect((await response.json()).name).toBe("filter-bar");
  });

  test("the preview doesn't write filters into the page URL, and shows no count in the bar", async ({ page }) => {
    await page.goto("/");
    const preview = page.locator("#preview-panel-preview");
    await preview.getByRole("button", { name: "Add Created Date filter" }).click();
    await page.getByRole("dialog", { name: "Created Date filter" }).getByRole("option", { name: "1 week ago" }).click();
    await expect(preview.getByRole("button", { name: "Created Date filter: 1 week ago. Edit" })).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
    await expect(preview.getByRole("group", { name: "Filters" })).not.toContainText(/batches|Showing/);
  });

  test("detail cards are live: + becomes × on a real chip", async ({ page }) => {
    await page.goto("/");
    // The cards are server-rendered; wait for hydration before clicking.
    await page.waitForLoadState("networkidle");
    // The first card: one Status chip on its own.
    const details = page.locator("#details > div > div").first();
    await details.getByRole("button", { name: "Add Status filter" }).click();
    await page.getByRole("dialog", { name: "Status filter" }).getByRole("option", { name: "Failed" }).click();
    const remove = details.getByRole("button", { name: "Remove Status filter" });
    await expect(remove.locator("svg")).toHaveClass(/rotate-45/);
    await remove.click();
    await expect(details.getByRole("button", { name: "Add Status filter" })).toBeVisible();
  });
});
