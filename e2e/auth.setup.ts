import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";

const email = process.env.E2E_USER_EMAIL ?? "e2e@wikiflow.test";
const password = process.env.E2E_USER_PASSWORD ?? "e2e-test-password-123";
const name = process.env.E2E_USER_NAME ?? "E2E Tester";

/**
 * Setup project: ensure the e2e user exists, sign in via Better Auth API
 * (faster + less flaky than UI login), and persist cookies to storageState.
 *
 * Better Auth requires an Origin header on credential endpoints.
 */
setup("authenticate e2e user", async ({ request, baseURL }) => {
  const origin = baseURL ?? "http://localhost:3000";
  const headers = {
    Origin: origin,
    "Content-Type": "application/json",
  };

  // Best-effort sign-up — 200 on create; non-2xx if the user already exists.
  await request.post("/api/auth/sign-up/email", {
    data: { name, email, password },
    headers,
    failOnStatusCode: false,
  });

  const signIn = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers,
  });
  expect(
    signIn.ok(),
    `sign-in failed: ${signIn.status()} ${await signIn.text()}`,
  ).toBeTruthy();

  await request.storageState({ path: AUTH_FILE });
});
