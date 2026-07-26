import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const fileUploadSchema = z.object({
  name: z.string().min(1, "Filename is required"),
  type: z.enum(ALLOWED_MIME_TYPES, {
    message: "Unsupported file type",
  }),
  size: z
    .number()
    .max(
      MAX_FILE_SIZE,
      `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    ),
});

export const uploadedFileSchema = z.object({
  url: z.string().url(),
  size: z.number(),
  type: z.string(),
  filename: z.string().optional(),
});

export type FileUploadValues = z.infer<typeof fileUploadSchema>;
export type UploadedFile = z.infer<typeof uploadedFileSchema>;
