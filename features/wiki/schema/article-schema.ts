import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const createArticleSchema = articleSchema.extend({
  published: z.boolean().optional(),
});

export const updateArticleSchema = articleSchema;

export type ArticleValues = z.infer<typeof articleSchema>;
export type CreateArticleValues = z.infer<typeof createArticleSchema>;
export type UpdateArticleValues = z.infer<typeof updateArticleSchema>;
