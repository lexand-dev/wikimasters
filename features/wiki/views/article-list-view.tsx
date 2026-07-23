import { WikiCard } from "@/features/wiki/components/wiki-card";
import type { ArticleSummary } from "@/features/wiki/types/article";

interface ArticleListViewProps {
  articles: ArticleSummary[];
}

export function ArticleListView({ articles }: ArticleListViewProps) {
  return (
    <main className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">
      {articles.map((article) => (
        <WikiCard key={article.id} article={article} />
      ))}
    </main>
  );
}
