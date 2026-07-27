import { rmSync } from "node:fs";
import type { FullConfig } from "@playwright/test";

/**
 * One-time suite cleanup. Keeps auth state locally for faster re-runs;
 * wipes it in CI so secrets never linger in the workspace.
 */
async function globalTeardown(_config: FullConfig) {
  if (process.env.CI) {
    rmSync("playwright/.auth", { recursive: true, force: true });
    console.log("[e2e] cleaned playwright/.auth");
  }
}

export default globalTeardown;
