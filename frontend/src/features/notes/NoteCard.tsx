import type { CSSProperties, ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDraggable } from '@dnd-kit/core'
import { Bookmark, MoreHorizontal, Pin, PinOff, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { useAppDnd } from '@/features/dnd/context'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/date'
import { tiltFor } from '@/lib/paper'
import type { Note } from '@/types/note'

interface NoteCardProps {
  note: Note
  folderName?: string | null
  onTogglePin?: (note: Note) => void
  onDelete?: (note: Note) => void
}

/** A draggable torn-paper note card (drag onto a sidebar folder to file it). */
export function NoteCard({ note, folderName, onTogglePin, onDelete }: NoteCardProps) {
  const { activeDrag } = useAppDnd()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `note-drag-${note.id}`,
    data: { type: 'note', id: note.id, label: note.title },
  })

  const dragging = isDragging && activeDrag?.id === note.id

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ '--paper-tilt': `${tiltFor(note.id)}deg` } as CSSProperties}
      className={cn('paper group cursor-grab active:cursor-grabbing', dragging && 'opacity-40')}
    >
      <span className="paper__bg" aria-hidden="true" />
      <div className="paper__content flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-parchment-200/70 px-2 py-0.5 text-[11px] font-medium text-ink-600">
              <Bookmark className="size-3" aria-hidden="true" />
              {folderName ?? 'Unfiled'}
            </span>
            <span className="rounded-full bg-parchment-100/80 px-2 py-0.5 text-[11px] text-ink-400">
              {formatRelative(note.updated_at)}
            </span>
            {note.is_pinned ? (
              <Pin className="size-3.5 fill-clay-500 text-clay-500" aria-label="Pinned" />
            ) : null}
          </div>

          <CardMenu note={note} onTogglePin={onTogglePin} onDelete={onDelete} />
        </div>

        <Link
          to={`/notes/${note.id}`}
          className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
        >
          <h3 className="font-serif text-lg font-semibold leading-snug text-ink-900">
            {note.title}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-ink-500">
            {note.content.trim() || 'No content yet.'}
          </p>
        </Link>
      </div>
    </article>
  )
}

function CardMenu({
  note,
  onTogglePin,
  onDelete,
}: {
  note: Note
  onTogglePin?: (note: Note) => void
  onDelete?: (note: Note) => void
}) {
  if (!onTogglePin && !onDelete) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${note.title}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-400 opacity-0 transition-opacity hover:bg-parchment-100 hover:text-ink-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-clay-500 group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="z-50 min-w-44 origin-top rounded-xl border border-parchment-200 bg-parchment-50 p-1.5 shadow-[0_16px_40px_-16px_rgba(61,45,28,0.35)] data-[state=open]:animate-[dropdown-in_140ms_ease-out]"
        >
          {onTogglePin ? (
            <CardMenuItem onSelect={() => onTogglePin(note)}>
              {note.is_pinned ? (
                <PinOff className="size-4" aria-hidden="true" />
              ) : (
                <Pin className="size-4" aria-hidden="true" />
              )}
              {note.is_pinned ? 'Unpin' : 'Pin'}
            </CardMenuItem>
          ) : null}
          {onTogglePin && onDelete ? (
            <DropdownMenu.Separator className="my-1 h-px bg-parchment-200" />
          ) : null}
          {onDelete ? (
            <CardMenuItem danger onSelect={() => onDelete(note)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </CardMenuItem>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function CardMenuItem({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode
  onSelect: () => void
  danger?: boolean
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-parchment-100',
        danger
          ? 'text-brick-600 data-[highlighted]:text-brick-600'
          : 'text-ink-700 data-[highlighted]:text-ink-900',
      )}
    >
      {children}
    </DropdownMenu.Item>
  )
}
