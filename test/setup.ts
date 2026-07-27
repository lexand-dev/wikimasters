import { existsSync } from "node:fs";
import dotenv from "dotenv";
import { vi } from "vitest";

// Load base test env first, then local overrides written by global setup
dotenv.config({ quiet: true, path: ".env.test" });
dotenv.config({ quiet: true, path: ".env.test.local" });

// Global mock: Next.js navigation primitives. Tests that need a specific
// behavior (e.g. `redirect` throwing `NEXT_REDIRECT` for deleteArticleForm)
// re-mock `next/navigation` locally — the test-file mock wins over this one.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(),
}));

// Global mock: Article summarization service (no real AI calls in tests).
// Named export matches `@/features/wiki/services/summarize-article.ts`.
vi.mock("@/features/wiki/services/summarize-article", () => ({
  summarizeArticle: vi.fn().mockResolvedValue("This is a test summary."),
}));
