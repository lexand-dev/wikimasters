import { afterEach, describe, expect, it, vi } from "vitest";

describe("resend client", () => {
  const previousApiKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    vi.resetModules();

    if (previousApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousApiKey;
    }
  });

  it("does not throw when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;

    await expect(import("@/lib/resend")).resolves.toBeDefined();

    const { getResendClient } = await import("@/lib/resend");
    expect(getResendClient()).toBeNull();
  });
});
