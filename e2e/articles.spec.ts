import { expect, test } from "@playwright/test";

/**
 * Authenticated article flows. Runs in the `chromium` project with
 * storageState from `auth.setup.ts` — every test starts already signed in.
 *
 * Create/update hit the AI summarize service, so those tests get a longer
 * timeout and the `@slow` tag.
 */
test.describe("articles @smoke", () => {
  test("authenticated user can open the wiki list", async ({ page }) => {
    await page.goto("/wiki");
    await expect(page).toHaveURL(/\/wiki/);
    // Authenticated chrome: account menu, no Sign In CTA.
    await expect(
      page.getByRole("button", { name: "Account menu" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toHaveCount(0);
  });

  test("landing page lists published articles with read links", async ({
    page,
  }) => {
    await page.goto("/");
    const readLinks = page.getByRole("link", { name: /Read article/i });
    // Seeded DB usually has articles; tolerate empty local DBs gracefully.
    const count = await readLinks.count();
    if (count > 0) {
      await expect(readLinks.first()).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "WikiFlow" })).toBeVisible();
    }
  });

  test("create editor page renders for authenticated users", async ({
    page,
  }) => {
    await page.goto("/wiki/edit/new");
    await expect(
      page.getByRole("heading", { name: "Create New Article" }),
    ).toBeVisible();
    await expect(page.getByLabel("Title *")).toBeVisible();
    await expect(
      page.getByPlaceholder("Write your article content in Markdown..."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Article" }),
    ).toBeVisible();
  });
});

test.describe("articles CRUD @slow", () => {
  test.setTimeout(90_000);

  test("create → view → edit → delete an article", async ({ page }) => {
    const stamp = Date.now();
    const title = `E2E Article ${stamp}`;
    const content = `## Hello from Playwright\n\nThis article was created at ${stamp}.`;
    const updatedTitle = `${title} (edited)`;
    const updatedContent = `${content}\n\nEdited body.`;

    // --- Create ---
    await page.goto("/wiki/edit/new");
    await page.getByLabel("Title *").fill(title);
    await page
      .getByPlaceholder("Write your article content in Markdown...")
      .fill(content);
    await page.getByRole("button", { name: "Save Article" }).click();

    // createArticle redirects to /wiki/:id after AI summarize + DB insert.
    await expect(page).toHaveURL(/\/wiki\/\d+/, { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { name: title, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Hello from Playwright")).toBeVisible();
    // Owner sees edit/delete controls.
    await expect(
      page.getByRole("link", { name: "Edit Article" }).first(),
    ).toBeVisible();

    const articleUrl = page.url();
    const articleId = articleUrl.split("/").pop();
    expect(articleId).toMatch(/^\d+$/);

    // --- Edit ---
    await page.getByRole("link", { name: "Edit Article" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/wiki/edit/${articleId}`));
    await expect(
      page.getByRole("heading", { name: "Edit Article" }),
    ).toBeVisible();

    await page.getByLabel("Title *").fill(updatedTitle);
    const editor = page.getByPlaceholder(
      "Write your article content in Markdown...",
    );
    await editor.fill(updatedContent);
    await page.getByRole("button", { name: "Save Article" }).click();

    await expect(page).toHaveURL(new RegExp(`/wiki/${articleId}`), {
      timeout: 60_000,
    });
    await expect(
      page.getByRole("heading", { name: updatedTitle, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Edited body.")).toBeVisible();

    // --- Delete ---
    // Two Delete buttons (header + footer); either is fine.
    await page.getByRole("button", { name: "Delete" }).first().click();
    // deleteArticleForm redirects to "/"
    await expect(page).toHaveURL("/", { timeout: 30_000 });

    // Soft check: direct navigation to the deleted article should 404 / not-found.
    await page.goto(`/wiki/${articleId}`);
    // App may render not-found or redirect; either way the edited title is gone.
    await expect(
      page.getByRole("heading", { name: updatedTitle, level: 1 }),
    ).toHaveCount(0);
  });
});
