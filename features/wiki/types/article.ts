export type Article = {
  id: number;
  title: string;
  content: string;
  author: string | null;
  createdAt: string;
  imageUrl?: string | null;
};

export type ArticleSummary = {
  id: number;
  title: string;
  author: string | null;
  date: string;
  summary: string;
  href: string;
};
