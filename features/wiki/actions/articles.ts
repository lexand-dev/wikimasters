"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { revalidateArticlesCache } from "@/features/wiki/data/articles";
import {
  type CreateArticleValues,
  createArticleSchema,
  type UpdateArticleValues,
  updateArticleSchema,
} from "@/features/wiki/schema/article-schema";
import { summarizeArticle } from "@/features/wiki/services/summarize-article";
import { getSession } from "@/lib/session";
import { createSlug } from "@/lib/utils";

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

function parseArticleId(id: string): number {
  const num = Number(id);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    throw new Error("Invalid article id");
  }
  return num;
}

export async function createArticle(data: CreateArticleValues) {
  const user = await requireUser();
  const values = createArticleSchema.parse(data);

  const baseSlug = createSlug(values.title);
  const slug = `${baseSlug}-${Date.now()}`;

  const summary = await summarizeArticle(values.title, values.content);

  const [response] = await db
    .insert(articles)
    .values({
      title: values.title,
      content: values.content,
      slug,
      authorId: user.id,
      published: values.published ?? true,
      imageUrl: values.imageUrl,
      summary,
    })
    .returning();

  await revalidateArticlesCache();

  return {
    success: true,
    message: "Article created",
    id: response.id,
  };
}

export async function updateArticle(id: string, data: UpdateArticleValues) {
  const user = await requireUser();
  const values = updateArticleSchema.parse(data);
  const articleId = parseArticleId(id);

  const summary = await summarizeArticle(values.title, values.content);

  const [result] = await db
    .update(articles)
    .set({
      title: values.title,
      content: values.content,
      imageUrl: data.imageUrl,
      summary,
    })
    .where(and(eq(articles.id, articleId), eq(articles.authorId, user.id)))
    .returning();

  if (!result) {
    throw new Error("Article not found or you are not the author");
  }

  await revalidateArticlesCache();

  return { success: true, message: `Article ${id} updated` };
}

export async function deleteArticle(id: string) {
  const user = await requireUser();
  const articleId = parseArticleId(id);

  const [result] = await db
    .delete(articles)
    .where(and(eq(articles.id, articleId), eq(articles.authorId, user.id)))
    .returning();

  if (!result) {
    throw new Error("Article not found or you are not the author");
  }

  await revalidateArticlesCache();

  return { success: true, message: `Article ${id} deleted` };
}

// Form-friendly server action: accepts FormData from a client form and calls deleteArticle
export async function deleteArticleForm(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (!id) {
    throw new Error("Missing article id");
  }

  await deleteArticle(String(id));
  redirect("/");
}
