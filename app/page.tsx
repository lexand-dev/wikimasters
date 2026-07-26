import { WikiCard } from "@/features/wiki/components/wiki-card";
import { getArticles } from "@/features/wiki/data/articles";

export default async function Home() {
  const articles = await getArticles();

  const summaries = articles.map((a) => ({
    id: a.id,
    title: a.title,
    author: a.author,
    date: a.createdAt,
    summary: a.excerpt,
    href: `/wiki/${a.id}`,
  }));

  return (
    <div>
      <main className="max-w-2xl mx-auto mt-10 flex flex-col gap-6">
        {summaries.map((article) => (
          <WikiCard key={article.id} article={article} />
        ))}
      </main>
    </div>
  );
}
