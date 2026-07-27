import { mkdirSync } from "node:fs";
import type { FullConfig } from "@playwright/test";

/**
 * One-time suite bootstrap (runs once before any project).
 * Auth session creation lives in `auth.setup.ts` (setup project) so it has
 * access to Playwright fixtures and runs after the webServer is ready.
 */
async function globalSetup(_config: FullConfig) {
  mkdirSync("playwright/.auth", { recursive: true });

  const email = process.env.E2E_USER_EMAIL ?? "e2e@wikiflow.test";
  const password = process.env.E2E_USER_PASSWORD ?? "e2e-test-password-123";

  if (password.length < 8) {
    throw new Error(
      "E2E_USER_PASSWORD must be at least 8 characters (auth schema minimum).",
    );
  }

  // Surface the resolved credentials so setup + specs share the same source.
  process.env.E2E_USER_EMAIL = email;
  process.env.E2E_USER_PASSWORD = password;
  process.env.E2E_USER_NAME ??= "E2E Tester";

  console.log(`[e2e] global setup ready (user: ${email})`);
}

export default globalSetup;
