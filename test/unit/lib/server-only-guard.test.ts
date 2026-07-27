import { describe, expect, it } from "vitest";

// Regression: importing a `server-only`-guarded module must NOT crash.
// The alias in vitest.config.ts substitutes a no-op stub for `server-only`,
// and test/setup.ts loads `.env` so the module's top-level env asserts pass.
// Dynamic import (vs static) avoids ES hoisting surprises if a future test
// needs to stub an env value first.
describe("server-only guard is bypassed under the test alias", () => {
  it("imports the guarded module without throwing", async () => {
    const { getSession } = await import("@/lib/session");
    expect(typeof getSession).toBe("function");
  });
});
