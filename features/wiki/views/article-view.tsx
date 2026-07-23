import { WikiArticleViewer } from "@/features/wiki/components/wiki-article-viewer";
import type { Article } from "@/features/wiki/types/article";

interface ArticleViewProps {
  article: Article;
  canEdit?: boolean;
}

export function ArticleView({ article, canEdit }: ArticleViewProps) {
  return <WikiArticleViewer article={article} canEdit={canEdit} />;
}
