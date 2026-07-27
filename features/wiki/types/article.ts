export type Article = {
  id: number;
  title: string;
  content: string;
  authorName: string | null;
  authorId: string;
  createdAt: string;
  imageUrl?: string | null;
};

export type ArticleSummary = {
  id: number;
  title: string;
  authorName: string | null;
  date: string;
  summary: string | null;
  href: string;
};
