"use server";

import { sendCelebrationEmail } from "@/features/wiki/actions/send-celebration-email";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";

const DEDUP_TTL_SECONDS = 60 * 60 * 24; // 24h unique-viewer window
const viewsKey = (id: number) => `wiki:article:${id}:views`;
const viewersKey = (id: number) => `wiki:article:${id}:viewers`;

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

export async function incrementArticleViews(
  id: number,
  authorId?: string,
): Promise<number> {
  const user = await requireUser();

  // Author previewing own article — never counts toward its views
  if (authorId && user.id === authorId) return 0;

  try {
    const pipelineResult = await redis
      .pipeline()
      .sadd(viewersKey(id), user.id)
      .expire(viewersKey(id), DEDUP_TTL_SECONDS)
      .exec<[number, 0 | 1]>();

    const added = pipelineResult?.[0];
    // SADD returns 1 if newly added (new unique viewer), 0 if already in set
    if (added !== 1) return 0;

    const count = await redis.incr(viewsKey(id));
    const numericCount = typeof count === "number" ? count : Number(count);
    sendCelebrationEmail({ articleId: id, pageviews: numericCount });
    return numericCount;
  } catch {
    return 0;
  }
}

export async function getArticleViews(id: number): Promise<number> {
  try {
    const count = await redis.get<number>(viewsKey(id));
    if (count === null || count === undefined) return 0;
    return typeof count === "number" ? count : Number(count);
  } catch {
    return 0;
  }
}
