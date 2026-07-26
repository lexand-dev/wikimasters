import { getArticles } from "@/features/wiki/data/articles";
import { ArticleListView } from "@/features/wiki/views/article-list-view";

export default async function WikiListPage() {
  const articles = await getArticles();
  return <ArticleListView articles={articles} />;
}
