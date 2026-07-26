"use server";

import { put } from "@vercel/blob";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  type UploadedFile,
} from "@/features/wiki/schema/upload-schema";
import { getSession } from "@/lib/session";

function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[\\/]/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "upload";
}

export async function uploadFile(
  formData: FormData,
): Promise<{ success: boolean; data?: UploadedFile; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return { success: false, error: "Unsupported file type" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`,
    };
  }

  try {
    const sanitized = sanitizeFilename(file.name);
    const blob = await put(sanitized, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return {
      success: true,
      data: {
        url: blob.url,
        size: file.size,
        type: file.type,
        filename: blob.pathname,
      },
    };
  } catch {
    return { success: false, error: "Upload failed" };
  }
}
