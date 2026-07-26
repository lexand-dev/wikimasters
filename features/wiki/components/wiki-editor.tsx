"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import MDEditor from "@uiw/react-md-editor";
import { Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createArticle, updateArticle } from "@/features/wiki/actions/articles";
import { uploadFile } from "@/features/wiki/actions/uploads";
import {
  type ArticleValues,
  articleSchema,
} from "@/features/wiki/schema/article-schema";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/features/wiki/schema/upload-schema";

interface WikiEditorProps {
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  articleId?: string;
}

export function WikiEditor({
  initialTitle = "",
  initialContent = "",
  isEditing = false,
  articleId,
}: WikiEditorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ArticleValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialTitle,
      content: initialContent,
      imageUrl: "",
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const selected = event.target.files?.[0] ?? null;

    if (!selected) {
      setFile(null);
      return;
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        selected.type as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      setFileError("Unsupported file type. Use JPEG, PNG, GIF, or WebP.");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFileError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB).`);
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
  };

  const onSubmit = async (values: ArticleValues) => {
    setSubmitError(null);

    try {
      let imageUrl: string | undefined;

      if (file) {
        setIsUploading(true);
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadFile(fd);
        setIsUploading(false);

        if (!result.success) {
          setSubmitError(result.error ?? "Upload failed");
          return;
        }

        imageUrl = result.data?.url;
      }

      const payload = {
        title: values.title,
        content: values.content,
        imageUrl,
      };

      if (isEditing && articleId) {
        await updateArticle(articleId, payload);
        router.push(`/wiki/${articleId}`);
      } else {
        const result = await createArticle(payload);
        if (result.id) {
          router.push(`/wiki/${result.id}`);
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setIsUploading(false);
      const message =
        err instanceof Error ? err.message : "Failed to submit article";
      setSubmitError(message);
      setError("root", { message });
    }
  };

  const handleCancel = () => {
    const shouldLeave = window.confirm(
      "Are you sure you want to cancel? Any unsaved changes will be lost.",
    );
    if (shouldLeave) {
      router.back();
    }
  };

  const pageTitle = isEditing ? "Edit Article" : "Create New Article";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        {isEditing && articleId && (
          <p className="text-muted-foreground mt-2">
            Editing article ID: {articleId}
          </p>
        )}
      </div>

      {submitError && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Article Title</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter article title..."
                className={errors.title ? "border-destructive" : ""}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Article Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown) *</Label>
              <div
                className={`border rounded-md ${
                  errors.content ? "border-destructive" : ""
                }`}
              >
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <MDEditor
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val || "")}
                      preview="edit"
                      hideToolbar={false}
                      visibleDragbar={false}
                      textareaProps={{
                        name: field.name,
                        placeholder:
                          "Write your article content in Markdown...",
                        style: { fontSize: 14, lineHeight: 1.5 },
                        autoCapitalize: "none",
                        autoComplete: "off",
                        autoCorrect: "off",
                        spellCheck: false,
                      }}
                    />
                  )}
                />
              </div>
              {errors.content && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <div className="space-y-2 flex flex-col justify-center items-center">
                  <Label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Click to upload an image
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Upload an image to attach to your article
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </div>

              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}

              {file && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded File:</Label>
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      {isUploading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="min-w-25 cursor-pointer"
              >
                {isUploading
                  ? "Uploading..."
                  : isSubmitting
                    ? "Saving..."
                    : "Save Article"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
