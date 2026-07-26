"use server";

import { redis } from "@/lib/redis";

const viewsKey = (id: number) => `wiki:article:${id}:views`;

export async function incrementArticleViews(id: number): Promise<number> {
  try {
    const count = await redis.incr(viewsKey(id));
    return typeof count === "number" ? count : Number(count);
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
