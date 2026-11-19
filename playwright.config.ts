import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const BASE_URL = "http://localhost:3100";
const systemChromium = "/usr/bin/chromium";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    // Prefer an installed system Chromium so no browser download is needed.
    launchOptions: existsSync(systemChromium) ? { executablePath: systemChromium } : {},
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The app bundle and every API response are served through Playwright
  // routes, so no Next.js dev server, Ollama, or API key is required.
});
