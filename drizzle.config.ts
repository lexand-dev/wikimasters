import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import assert from "node:assert";

assert(process.env.DATABASE_URL, "You need a DATABASE_URL");

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
