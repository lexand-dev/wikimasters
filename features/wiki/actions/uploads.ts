"use server";

import { put } from "@vercel/blob";
import {
  fileUploadSchema,
  type UploadedFile,
} from "@/features/wiki/schema/upload-schema";
import { getSession } from "@/lib/session";

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session.user;
}

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "upload";
}

export async function uploadFile(formData: FormData): Promise<UploadedFile> {
  await requireUser();

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  const values = fileUploadSchema.parse({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  const sanitized = sanitizeFilename(values.name);
  const blob = await put(sanitized, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    size: values.size,
    type: values.type,
    filename: blob.pathname,
  };
}
