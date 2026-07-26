import { notFound } from "next/navigation";
import { getArticleById } from "@/features/wiki/data/articles";
import { EditorView } from "@/features/wiki/views/editor-view";
import { getSession } from "@/lib/session";

interface EditArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;

  const articleId = Number(id);
  if (
    !Number.isFinite(articleId) ||
    !Number.isInteger(articleId) ||
    articleId <= 0
  ) {
    notFound();
  }

  const article = await getArticleById(articleId);
  if (!article) {
    notFound();
  }

  const session = await getSession();
  if (session?.user.id !== article.authorId) {
    notFound();
  }

  return (
    <EditorView
      initialTitle={article.title}
      initialContent={article.content}
      isEditing
      articleId={id}
    />
  );
}
