import assert from "node:assert";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./schema";

assert(process.env.DATABASE_URL, "You need a DATABASE_URL");

export const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, relations });
