import "server-only";
import assert from "node:assert";
import { Redis } from "@upstash/redis";

assert(process.env.UPSTASH_REDIS_REST_URL, "You need a UPSTASH_REDIS_REST_URL");
assert(
  process.env.UPSTASH_REDIS_REST_TOKEN,
  "You need a UPSTASH_REDIS_REST_TOKEN",
);

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
