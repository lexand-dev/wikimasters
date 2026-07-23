import { WikiEditor } from "@/features/wiki/components/wiki-editor";

interface EditorViewProps {
  initialTitle?: string;
  initialContent?: string;
  isEditing?: boolean;
  articleId?: string;
}

export function EditorView({
  initialTitle,
  initialContent,
  isEditing,
  articleId,
}: EditorViewProps) {
  return (
    <WikiEditor
      initialTitle={initialTitle}
      initialContent={initialContent}
      isEditing={isEditing}
      articleId={articleId}
    />
  );
}
