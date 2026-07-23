import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const updateArticleSchema = createArticleSchema.partial();

export type CreateArticleValues = z.infer<typeof createArticleSchema>;
export type UpdateArticleValues = z.infer<typeof updateArticleSchema>;
