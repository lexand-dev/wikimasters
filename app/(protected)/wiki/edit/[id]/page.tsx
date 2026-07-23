import { EditorView } from "@/features/wiki/views/editor-view";

interface EditArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { id } = await params;

  // In a real app, you would fetch the article data here
  const mockData =
    id !== "new"
      ? {
          title: `Sample Article ${id}`,
          content: `# Sample Article ${id}

This is some sample markdown content for article ${id}.

## Features
- **Bold text**
- *Italic text*
- [Links](https://example.com)

## Code Example
\`\`\`javascript
console.log("Hello from article ${id}");
\`\`\`

This would normally be fetched from your API.`,
        }
      : {};

  return (
    <EditorView
      initialTitle={mockData.title}
      initialContent={mockData.content}
      isEditing
      articleId={id}
    />
  );
}
