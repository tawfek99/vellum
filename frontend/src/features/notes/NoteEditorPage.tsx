import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Loader2, Pin, PinOff, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { updateNote } from '@/features/notes/api'
import { useFolders } from '@/hooks/useFolders'
import { useDeleteNote, useNote, useUpdateNote } from '@/hooks/useNotes'
import { cn } from '@/lib/cn'
import type { Note } from '@/types/note'

type SaveStatus = 'idle' | 'saving' | 'saved'

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { data: note, isLoading, isError } = useNote(id)

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (isError || !note) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-serif text-xl font-semibold text-ink-900">Note not found</h1>
        <p className="mt-2 text-sm text-ink-500">It may have been deleted.</p>
        <Link
          to="/notes"
          className="mt-4 inline-block text-sm font-medium text-clay-600 hover:text-clay-700"
        >
          Back to notes
        </Link>
      </div>
    )
  }

  // Keyed by id so each note gets a fresh editor with no stale state.
  return <NoteEditor key={note.id} note={note} />
}

function NoteEditor({ note }: { note: Note }) {
  const navigate = useNavigate()
  const { mutate: saveNote } = useUpdateNote()
  const { mutate: removeNote } = useDeleteNote()
  const foldersQuery = useFolders()

  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const latest = useRef({ title: note.title, content: note.content })
  const lastSaved = useRef({ title: note.title, content: note.content })

  // Debounced autosave whenever the title or content changes.
  useEffect(() => {
    if (title === note.title && content === note.content) return

    const handle = window.setTimeout(() => {
      saveNote(
        { id: note.id, input: { title, content } },
        {
          onSuccess: (saved) => {
            lastSaved.current = { title: saved.title, content: saved.content }
            setStatus('saved')
            // Adopt server-side normalization without clobbering newer typing.
            setTitle((current) => (current === title ? saved.title : current))
            setContent((current) => (current === content ? saved.content : current))
          },
        },
      )
    }, 800)
    return () => window.clearTimeout(handle)
  }, [title, content, note, saveNote])

  // Flush unsaved changes when leaving the editor.
  useEffect(() => {
    return () => {
      // We deliberately read the *latest* values at unmount time.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      const { title: t, content: c } = latest.current
      const saved = lastSaved.current
      if (t !== saved.title || c !== saved.content) {
        void updateNote(note.id, { title: t, content: c }).catch(() => {})
      }
    }
  }, [note.id])

  function handleTitleChange(value: string) {
    setTitle(value)
    latest.current.title = value
    setStatus('saving')
  }

  function handleContentChange(value: string) {
    setContent(value)
    latest.current.content = value
    setStatus('saving')
  }

  const folders = foldersQuery.data ?? []

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Notes
        </Link>

        <span
          aria-live="polite"
          className="ml-1 inline-flex items-center gap-1.5 text-xs text-ink-400"
        >
          {status === 'saving' ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : status === 'saved' ? (
            <>
              <Check className="size-3.5 text-clay-600" aria-hidden="true" />
              Saved
            </>
          ) : null}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => saveNote({ id: note.id, input: { is_pinned: !note.is_pinned } })}
            aria-pressed={note.is_pinned}
            aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-clay-500',
              note.is_pinned
                ? 'bg-parchment-200 text-clay-700'
                : 'text-ink-500 hover:bg-parchment-100 hover:text-ink-900',
            )}
          >
            {note.is_pinned ? (
              <PinOff className="size-4" aria-hidden="true" />
            ) : (
              <Pin className="size-4" aria-hidden="true" />
            )}
          </button>

          <select
            value={note.folder_id ?? ''}
            onChange={(event) =>
              saveNote({ id: note.id, input: { folder_id: event.target.value || null } })
            }
            aria-label="Move to folder"
            className="h-9 rounded-lg border border-parchment-300 bg-parchment-50 px-3 text-sm text-ink-900 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/25"
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete note"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-brick-50 hover:text-brick-600 focus-visible:outline-2 focus-visible:outline-brick-600"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
        placeholder="Untitled"
        aria-label="Note title"
        className="w-full border-none bg-transparent font-serif text-3xl font-semibold tracking-tight text-ink-900 placeholder:text-ink-300 focus:outline-none"
      />

      <textarea
        value={content}
        onChange={(event) => handleContentChange(event.target.value)}
        placeholder="Start writing…"
        aria-label="Note content"
        spellCheck={false}
        className="mt-4 min-h-[60vh] w-full flex-1 resize-none border-none bg-transparent text-[15px] leading-7 text-ink-800 placeholder:text-ink-300 focus:outline-none"
      />

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete note?"
        description={`“${note.title}” will be permanently deleted.`}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                setConfirmDelete(false)
                removeNote(note.id, { onSuccess: () => navigate('/notes') })
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  )
}
