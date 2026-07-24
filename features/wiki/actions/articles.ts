"use server";

import { redirect } from "next/navigation";
import {
  type CreateArticleValues,
  createArticleSchema,
  type UpdateArticleValues,
  updateArticleSchema,
} from "@/features/wiki/schema/article-schema";
import { getSession } from "@/lib/session";

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function createArticle(data: CreateArticleValues) {
  const user = await requireUser();
  const values = createArticleSchema.parse(data);

  // TODO: Replace with actual database insert
  console.log("✨ createArticle called:", { ...values, authorId: user.id });
  return { success: true, message: "Article create logged (stub)" };
}

export async function updateArticle(id: string, data: UpdateArticleValues) {
  const user = await requireUser();
  const values = updateArticleSchema.parse(data);

  // TODO: Replace with actual database update
  console.log("📝 updateArticle called:", { ...values, id, authorId: user.id });
  return { success: true, message: `Article ${id} update logged (stub)` };
}

export async function deleteArticle(id: string) {
  const user = await requireUser();
  // TODO: Replace with actual database delete
  console.log("🗑️ deleteArticle called:", id, "with author", user.name);
  return { success: true, message: `Article ${id} delete logged (stub)` };
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
