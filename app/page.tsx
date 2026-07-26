import { WikiCard } from "@/features/wiki/components/wiki-card";
import { getArticles } from "@/features/wiki/data/articles";

export default async function Home() {
  const articles = await getArticles();

  return (
    <div>
      <main className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">
        {articles.map((article) => (
          <WikiCard key={article.id} article={article} />
        ))}
      </main>
    </div>
  );
}
