import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["html", { open: "never" }], ["list"]],
  use: { baseURL: "http://127.0.0.1:3001", trace: "retain-on-failure", screenshot: "only-on-failure", colorScheme: "dark" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: { command: "next dev --port 3001", url: "http://127.0.0.1:3001", reuseExistingServer: false, timeout: 120_000, env: { NEXT_PUBLIC_USE_MSW: "true" } },
});
