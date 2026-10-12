import { useDraggable } from '@dnd-kit/core'
import { NotebookText, Pin } from 'lucide-react'
import { Link } from 'react-router'

import { useAppDnd } from '@/features/dnd/context'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/date'
import type { Note } from '@/types/note'

/** A draggable note card in the notes list (drag onto a folder to file it). */
export function NoteListItem({ note, folderName }: { note: Note; folderName?: string | null }) {
  const { activeDrag } = useAppDnd()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `note-drag-${note.id}`,
    data: { type: 'note', id: note.id, label: note.title },
  })

  const dragging = isDragging && activeDrag?.type === 'note'

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-start gap-3 rounded-xl border border-parchment-200 bg-parchment-50 p-4 transition-colors hover:border-parchment-300',
        dragging && 'opacity-40',
      )}
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-parchment-100 text-clay-600">
        <NotebookText className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            to={`/notes/${note.id}`}
            className="truncate font-medium text-ink-900 hover:text-clay-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
          >
            {note.title}
          </Link>
          {note.is_pinned ? (
            <Pin className="size-3.5 shrink-0 fill-clay-500 text-clay-500" aria-label="Pinned" />
          ) : null}
        </div>

        <p className="mt-1 line-clamp-2 text-sm text-ink-500">
          {note.content.trim() || 'No content yet.'}
        </p>

        <p className="mt-2 text-xs text-ink-400">
          {folderName ? `${folderName} · ` : ''}
          Updated {formatRelative(note.updated_at)}
        </p>
      </div>
    </div>
  )
}
