import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks (hoisted) ------------------------------------------------------
// vi.mock factories are hoisted to the top of the file, so any variables they
// reference must also be hoisted via vi.hoisted() — otherwise they would be
// in the temporal dead zone when the factory runs.

const mocks = vi.hoisted(() => {
  const returningMock = vi.fn();
  const valuesMock = vi.fn((payload: unknown) => ({
    returning: returningMock,
  }));
  const setMock = vi.fn((payload: unknown) => ({
    where: vi.fn(() => ({ returning: returningMock })),
  }));
  const whereInsertMock = vi.fn(() => ({ values: valuesMock }));
  const whereDeleteMock = vi.fn(() => ({ returning: returningMock }));

  const db = {
    insert: vi.fn(() => ({ values: valuesMock, where: whereInsertMock })),
    update: vi.fn(() => ({ set: setMock })),
    delete: vi.fn(() => ({ where: whereDeleteMock })),
  };

  return {
    db,
    returningMock,
    valuesMock,
    setMock,
    summarizeArticle: vi.fn(),
    revalidateArticlesCache: vi.fn(),
    getSession: vi.fn(),
    redirect: vi.fn(() => {
      throw new Error("__NEXT_REDIRECT__");
    }),
  };
});

vi.mock("@/db", () => ({ db: mocks.db }));

vi.mock("@/db/schema", () => ({
  articles: { id: "articles.id", authorId: "articles.authorId" },
}));

vi.mock("@/features/wiki/services/summarize-article", () => ({
  summarizeArticle: mocks.summarizeArticle,
}));

vi.mock("@/features/wiki/data/articles", () => ({
  revalidateArticlesCache: mocks.revalidateArticlesCache,
}));

vi.mock("@/lib/session", () => ({ getSession: mocks.getSession }));

vi.mock("@/lib/utils", () => ({
  createSlug: vi.fn(
    (title: string) => `slug-${title.toLowerCase().replace(/\s+/g, "-")}`,
  ),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

// Real schema is used for validation inside actions
import {
  createArticle,
  deleteArticle,
  deleteArticleForm,
  updateArticle,
} from "@/features/wiki/actions/articles";

const {
  db,
  returningMock,
  valuesMock,
  setMock,
  summarizeArticle,
  revalidateArticlesCache,
  getSession,
  redirect,
} = mocks;

const USER = { id: "user-1", name: "Ella", email: "ella@test.dev" };

beforeEach(() => {
  getSession.mockResolvedValue({ user: USER });
  summarizeArticle.mockResolvedValue("summary-text");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("article actions — auth guard", () => {
  it("throws Unauthorized when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(createArticle({ title: "t", content: "c" })).rejects.toThrow(
      "Unauthorized",
    );
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("createArticle", () => {
  it("inserts a new article and revalidates the cache", async () => {
    returningMock.mockResolvedValueOnce([{ id: 42 }]);

    const result = await createArticle({
      title: "Hello World",
      content: "Body",
      published: false,
      imageUrl: "",
    });

    expect(result).toEqual({
      success: true,
      message: "Article created",
      id: 42,
    });

    // summary generation
    expect(summarizeArticle).toHaveBeenCalledWith("Hello World", "Body");

    // insert payload
    expect(db.insert).toHaveBeenCalledTimes(1);
    const payload = valuesMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      title: "Hello World",
      content: "Body",
      authorId: USER.id,
      published: false,
      summary: "summary-text",
    });
    expect(payload.slug).toContain("slug-hello-world-");

    expect(revalidateArticlesCache).toHaveBeenCalledTimes(1);
  });

  it("defaults published to true when omitted", async () => {
    returningMock.mockResolvedValueOnce([{ id: 1 }]);

    await createArticle({ title: "T", content: "C" });

    const payload = valuesMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.published).toBe(true);
  });

  it("rejects invalid input via zod", async () => {
    await expect(
      createArticle({ title: "", content: "C" } as never),
    ).rejects.toThrow();
    expect(db.insert).not.toHaveBeenCalled();
  });
});

describe("updateArticle", () => {
  it("updates an article owned by the session user", async () => {
    returningMock.mockResolvedValueOnce([{ id: 7 }]);

    const result = await updateArticle("7", {
      title: "Updated",
      content: "New body",
      imageUrl: "",
    });

    expect(result).toEqual({
      success: true,
      message: "Article 7 updated",
    });

    expect(setMock).toHaveBeenCalledTimes(1);
    const [setPayload] = setMock.mock.calls[0];
    expect(setPayload).toMatchObject({
      title: "Updated",
      content: "New body",
      summary: "summary-text",
    });
    expect(revalidateArticlesCache).toHaveBeenCalledTimes(1);
  });

  it("throws when the article is not found or not owned", async () => {
    returningMock.mockResolvedValueOnce([]);

    await expect(
      updateArticle("99", { title: "T", content: "C" }),
    ).rejects.toThrow("Article not found or you are not the author");
  });

  it("rejects an invalid id", async () => {
    await expect(
      updateArticle("abc", { title: "T", content: "C" }),
    ).rejects.toThrow("Invalid article id");
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("deleteArticle", () => {
  it("deletes an article owned by the session user", async () => {
    returningMock.mockResolvedValueOnce([{ id: 5 }]);

    const result = await deleteArticle("5");

    expect(result).toEqual({
      success: true,
      message: "Article 5 deleted",
    });
    expect(revalidateArticlesCache).toHaveBeenCalledTimes(1);
  });

  it("throws when the article is not found or not owned", async () => {
    returningMock.mockResolvedValueOnce([]);

    await expect(deleteArticle("404")).rejects.toThrow(
      "Article not found or you are not the author",
    );
  });

  it("rejects a non-positive / non-integer id", async () => {
    await expect(deleteArticle("0")).rejects.toThrow("Invalid article id");
    await expect(deleteArticle("1.5")).rejects.toThrow("Invalid article id");
    await expect(deleteArticle("-3")).rejects.toThrow("Invalid article id");
  });
});

describe("deleteArticleForm", () => {
  it("delegates to deleteArticle with the form id and redirects", async () => {
    returningMock.mockResolvedValueOnce([{ id: 8 }]);

    const formData = new FormData();
    formData.set("id", "8");

    await expect(deleteArticleForm(formData)).rejects.toThrow(
      "__NEXT_REDIRECT__",
    );

    expect(returningMock).toHaveBeenCalled();
    expect(revalidateArticlesCache).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("throws when the form is missing an id", async () => {
    await expect(deleteArticleForm(new FormData())).rejects.toThrow(
      "Missing article id",
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});
