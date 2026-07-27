import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = resolve(__dirname);
const serverOnlyStub = resolve(__dirname, "./test/mocks/server-only.ts");

// Shared Vite bit (plugins + path alias) inherited by both projects.
const shared = {
  plugins: [react()],
  resolve: {
    alias: {
      // tsconfig.json maps `@/*` -> `./*` (repo root), no `src/` dir here.
      "@": root,
      // Avoid `server-only` / `client-only` runtime crashes when importing
      // guarded modules (lib/session, lib/redis, lib/auth) in tests.
      "server-only": serverOnlyStub,
      "client-only": serverOnlyStub,
    },
  },
};

// Shared test options (mock hygiene + global setup file).
const sharedTest = {
  globals: false,
  setupFiles: ["./test/setup.ts"],
  clearMocks: true,
  restoreMocks: true,
  unstubEnvs: true,
  unstubGlobals: true,
};

export default defineConfig({
  ...shared,
  test: {
    // Split into two projects so action tests stay fast & node-scoped and
    // component tests get a DOM runtime when added later.
    projects: [
      {
        ...shared,
        test: {
          ...sharedTest,
          name: "unit",
          environment: "node",
          dir: "./test/unit",
          include: ["**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        ...shared,
        test: {
          ...sharedTest,
          name: "component",
          environment: "happy-dom",
          dir: "./test/component",
          include: ["**/*.{test,spec}.{ts,tsx}"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["features/**/*.ts", "lib/**/*.ts", "db/**/*.ts"],
      exclude: ["**/*.test.ts", "db/seed.ts"],
    },
  },
});
