import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { redis } from "@/lib/redis";

const PUBLISHED_LIST_CACHE_KEY = "wiki:articles:published:list";
const PUBLISHED_LIST_TTL_SECONDS = 60 * 5; // 5 minutes

async function fetchPublishedArticlesFromDb() {
  return db
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
}

export async function getArticles() {
  const cached = await redis.get<
    Awaited<ReturnType<typeof fetchPublishedArticlesFromDb>>
  >(PUBLISHED_LIST_CACHE_KEY);
  if (cached) return cached;

  const response = await fetchPublishedArticlesFromDb();

  await redis.set(PUBLISHED_LIST_CACHE_KEY, response, {
    ex: PUBLISHED_LIST_TTL_SECONDS,
  });

  return response;
}

export async function revalidateArticlesCache() {
  try {
    await redis.del(PUBLISHED_LIST_CACHE_KEY);
  } catch {
    // Best-effort invalidation; TTL will eventually refresh the entry.
  }
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
