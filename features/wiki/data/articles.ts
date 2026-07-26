import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, user } from "@/db/schema";
import type { ArticleSummary } from "@/features/wiki/types/article";
import { formatDate } from "@/lib/format";
import { redis } from "@/lib/redis";

const PUBLISHED_LIST_CACHE_KEY = "wiki:articles:published:list";
const PUBLISHED_LIST_TTL_SECONDS = 60 * 5; // 5 minutes

async function fetchPublishedArticlesFromDb(): Promise<ArticleSummary[]> {
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      createdAt: articles.createdAt,
      excerpt: sql<string>`substring(${articles.content}, 1, 200)`.as(
        "excerpt",
      ),
      authorName: user.name,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .leftJoin(user, eq(user.id, articles.authorId))
    .orderBy(desc(articles.createdAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    authorName: r.authorName,
    date: formatDate(r.createdAt),
    summary: r.excerpt,
    href: `/wiki/${r.id}`,
  }));
}

export async function getArticles(): Promise<ArticleSummary[]> {
  try {
    const cached = await redis.get<ArticleSummary[]>(PUBLISHED_LIST_CACHE_KEY);
    if (cached) return cached;
  } catch {
    // Cache read failed — fall through to DB; never block on cache errors.
  }

  const response = await fetchPublishedArticlesFromDb();

  try {
    await redis.set(PUBLISHED_LIST_CACHE_KEY, response, {
      ex: PUBLISHED_LIST_TTL_SECONDS,
    });
  } catch {
    // Cache write failed — non-fatal; next read will retry.
  }

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
      authorName: user.name,
      authorId: articles.authorId,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .leftJoin(user, eq(user.id, articles.authorId));

  return response;
}
