import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

import { cn } from '@/lib/cn'

function readMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown: { getMarkdown: () => string } }
  return storage.markdown.getMarkdown()
}

interface RichTextEditorProps {
  /** Initial markdown. The editor is uncontrolled after mount. */
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  className?: string
}

/** Live-preview markdown editor (TipTap), serialized to markdown. */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, transformPastedText: true, transformCopiedText: true }),
    ],
    content: value,
    editorProps: {
      attributes: { class: 'note-prose' },
    },
    onUpdate: ({ editor: current }) => onChange(readMarkdown(current)),
  })

  return <EditorContent editor={editor} className={cn(className)} />
}
