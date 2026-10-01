import { defineConfig, devices } from "@playwright/test";

// Same port as `pnpm dev`. Next.js allows one dev server per project, so locally the tests
// reuse a running `pnpm dev` instead of starting a second one.
const PORT = 5000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The landing and docs pages link to the built registry JSON, so build it first.
    command: `pnpm registry:build && pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
