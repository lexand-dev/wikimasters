import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Prefer a dedicated e2e env file when present; fall back to .env.
for (const path of [".env.test.local", ".env.test", ".env"]) {
  if (existsSync(path)) {
    dotenv.config({ path: resolve(__dirname, path), quiet: true });
    break;
  }
}

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const AUTH_FILE = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.{spec,setup}.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "on-failure" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "en-US",
  },
  projects: [
    // One-time auth: signs in (or signs up) the e2e user and writes storageState.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Unauthenticated flows (sign-in / sign-up / redirects). No storage state.
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    // Authenticated flows — depend on setup project's storageState.
    {
      name: "chromium",
      testMatch: /articles\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "bun run build && bun run start" : "bun run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
