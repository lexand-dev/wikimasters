import type { ArticleSummary } from "@/features/wiki/types/article";
import { ArticleListView } from "@/features/wiki/views/article-list-view";

// TODO: Replace mock list with a real DB query (gated by the (protected) layout)
const articles: ArticleSummary[] = [
  {
    id: 1,
    title: "Complete Intro to React",
    author: "Brian Holt",
    date: "Sep 2025",
    summary:
      "Learn React from the ground up with Brian Holt. Covers components, hooks, state, effects, and building modern UIs. Perfect for beginners and those wanting a solid foundation.",
    href: "/wiki/1",
  },
  {
    id: 2,
    title: "Rust for TypeScript Developers",
    author: "ThePrimeagen",
    date: "Sep 2025",
    summary:
      "ThePrimeagen teaches Rust to JavaScript/TypeScript devs. Dive into Rust's memory safety, ownership, and concurrency with fun, practical examples.",
    href: "/wiki/2",
  },
];

export default function WikiListPage() {
  return <ArticleListView articles={articles} />;
}
