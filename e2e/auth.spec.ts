import { expect, test } from "@playwright/test";

/** Form submit buttons — avoids clashing with navbar "Sign In" / "Sign Up" CTAs. */
const formSubmit = (page: import("@playwright/test").Page) =>
  page.locator("form button[type='submit']");

const cardTitle = (page: import("@playwright/test").Page) =>
  page.locator('[data-slot="card-title"]');

/**
 * Unauthenticated flows. Runs in the `auth` project with a clean browser
 * context (no storageState). Does NOT depend on the setup project.
 */
test.describe("auth @smoke", () => {
  test("landing page renders the brand and auth CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "WikiFlow" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
  });

  test("protected /wiki redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/wiki");
    await expect(page).toHaveURL(/\/sign-in/);
    // CardTitle is a <div>, not a heading role.
    await expect(cardTitle(page)).toHaveText("Sign in");
  });

  test("sign-in form shows validation errors for empty submit", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await formSubmit(page).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("sign-in rejects invalid credentials", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("nobody@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await formSubmit(page).click();

    // Sonner toast — message text comes from Better Auth.
    await expect(
      page.getByText(/sign in failed|invalid|incorrect|credentials/i),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in with valid credentials lands on /wiki", async ({
    page,
    baseURL,
  }) => {
    const email = process.env.E2E_USER_EMAIL ?? "e2e@wikiflow.test";
    const password = process.env.E2E_USER_PASSWORD ?? "e2e-test-password-123";
    const origin = baseURL ?? "http://localhost:3000";

    // Ensure user exists (idempotent — ignore failure if already registered).
    await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: process.env.E2E_USER_NAME ?? "E2E Tester",
        email,
        password,
      },
      headers: { Origin: origin, "Content-Type": "application/json" },
      failOnStatusCode: false,
    });

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await formSubmit(page).click();

    await expect(page).toHaveURL(/\/wiki/);
    await expect(
      page.getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
  });

  test("sign-up form shows validation for short password", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("New User");
    await page.getByLabel("Email").fill("new-user@example.com");
    await page.getByLabel("Password").fill("short");
    await formSubmit(page).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("sign-up creates an account and redirects to /wiki", async ({
    page,
  }) => {
    const unique = Date.now();
    const email = `e2e-signup-${unique}@wikiflow.test`;

    await page.goto("/sign-up");
    await page.getByLabel("Name").fill(`Signup ${unique}`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("signup-password-123");
    await formSubmit(page).click();

    await expect(page).toHaveURL(/\/wiki/);
    await expect(
      page.getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
  });

  test("sign-out returns to the public landing page", async ({
    page,
    baseURL,
  }) => {
    const email = process.env.E2E_USER_EMAIL ?? "e2e@wikiflow.test";
    const password = process.env.E2E_USER_PASSWORD ?? "e2e-test-password-123";
    const origin = baseURL ?? "http://localhost:3000";

    await page.request.post("/api/auth/sign-up/email", {
      data: {
        name: process.env.E2E_USER_NAME ?? "E2E Tester",
        email,
        password,
      },
      headers: { Origin: origin, "Content-Type": "application/json" },
      failOnStatusCode: false,
    });

    // UI sign-in so cookies land in this page's context.
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await formSubmit(page).click();
    await expect(page).toHaveURL(/\/wiki/);

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
  });
});
