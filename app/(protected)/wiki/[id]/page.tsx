import { notFound } from "next/navigation";
import { getArticleViews } from "@/features/wiki/actions/pageviews";
import { getArticleById } from "@/features/wiki/data/articles";
import { ArticleView } from "@/features/wiki/views/article-view";
import { getSession } from "@/lib/session";

interface ViewArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewArticlePage({
  params,
}: ViewArticlePageProps) {
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

  const [session, pageviews] = await Promise.all([
    getSession(),
    getArticleViews(articleId),
  ]);

  const canEdit = session?.user.id === article.authorId;

  return (
    <ArticleView article={article} canEdit={canEdit} pageviews={pageviews} />
  );
}
