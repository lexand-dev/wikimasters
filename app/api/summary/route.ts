import { eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { revalidateArticlesCache } from "@/features/wiki/data/articles";
import summarizeArticle from "@/features/wiki/services/summarize-article";

export async function GET(req: NextRequest) {
  if (
    process.env.NODE_ENV !== "development" &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // find articles that don't yet have a summary
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
    })
    .from(articles)
    .where(isNull(articles.summary));

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  let updated = 0;
  console.log("🤖 Starting AI summary job");

  for (const row of rows) {
    try {
      const summary = await summarizeArticle(row.title ?? "", row.content);

      if (summary && summary.trim().length > 0) {
        await db
          .update(articles)
          .set({ summary })
          .where(eq(articles.id, row.id));
        updated++;
      }
    } catch {
      console.warn("⚠️ Failed to summarize article id=", row.id);
    }
  }

  // Clear articles cache used by getArticles
  try {
    await revalidateArticlesCache();
  } catch (e) {
    console.warn("⚠️ Failed to clear articles cache", e);
  }

  console.log(`🤖 Concluding AI summary job, updated ${updated} rows`);
  return NextResponse.json({ ok: true, updated });
}
