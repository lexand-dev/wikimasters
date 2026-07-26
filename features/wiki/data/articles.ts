import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, user } from "@/db/schema";

export async function getArticles() {
  const response = await db
    .select({
      id: articles.id,
      title: articles.title,
      createdAt: articles.createdAt,
      excerpt: sql<string>`substring(${articles.content}, 1, 200)`.as(
        "excerpt",
      ),
      author: user.name,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .leftJoin(user, eq(user.id, articles.authorId))
    .orderBy(desc(articles.createdAt));

  return response;
}

export async function getArticleById(id: number) {
  const [response] = await db
    .select({
      id: articles.id,
      title: articles.title,
      createdAt: articles.createdAt,
      content: articles.content,
      author: user.name,
      authorId: articles.authorId,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .leftJoin(user, eq(user.id, articles.authorId));

  return response;
}
