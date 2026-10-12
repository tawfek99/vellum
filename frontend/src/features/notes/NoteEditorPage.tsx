import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  ArrowLeft,
  Bookmark,
  Check,
  FolderInput,
  Link2,
  Loader2,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { RichTextEditor } from '@/components/notes/RichTextEditor'
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
  const [moveOpen, setMoveOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const latest = useRef({ title: note.title, content: note.content })
  const lastSaved = useRef({ title: note.title, content: note.content })

  // Debounced autosave.
  useEffect(() => {
    if (title === note.title && content === note.content) return

    const handle = window.setTimeout(() => {
      saveNote(
        { id: note.id, input: { title, content } },
        {
          onSuccess: (saved) => {
            lastSaved.current = { title: saved.title, content: saved.content }
            setStatus('saved')
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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  const folders = foldersQuery.data ?? []

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 pb-4">
        <Link
          to="/notes"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Notes
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
          >
            {copied ? (
              <Check className="size-4 text-clay-600" aria-hidden="true" />
            ) : (
              <Link2 className="size-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy link'}</span>
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Note actions"
                className="inline-flex size-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500 data-[state=open]:bg-parchment-100"
              >
                <Bookmark className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="z-50 min-w-48 rounded-xl border border-parchment-200 bg-parchment-50 p-1.5 shadow-[0_16px_40px_-16px_rgba(61,45,28,0.35)]"
              >
                <MenuRow
                  onSelect={() => saveNote({ id: note.id, input: { is_pinned: !note.is_pinned } })}
                >
                  {note.is_pinned ? (
                    <PinOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Pin className="size-4" aria-hidden="true" />
                  )}
                  {note.is_pinned ? 'Unpin' : 'Pin to top'}
                </MenuRow>
                <MenuRow onSelect={() => setMoveOpen(true)}>
                  <FolderInput className="size-4" aria-hidden="true" />
                  Move to folder…
                </MenuRow>
                <DropdownMenu.Separator className="my-1 h-px bg-parchment-200" />
                <MenuRow danger onSelect={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </MenuRow>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Untitled"
          aria-label="Note title"
          className="w-full border-none bg-transparent font-serif text-3xl font-semibold tracking-tight text-ink-900 placeholder:text-ink-300 focus:outline-none"
        />

        <RichTextEditor
          key={note.id}
          value={note.content}
          onChange={handleContentChange}
          className="mt-5 min-h-[50vh]"
        />
      </div>

      <div className="pointer-events-none absolute bottom-2 right-2" aria-live="polite">
        {status === 'saving' ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-parchment-300 bg-parchment-50/80 px-2 py-1 text-[10px] font-medium text-ink-400">
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            Saving…
          </span>
        ) : status === 'saved' ? (
          <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-md border border-clay-500/40 bg-parchment-50/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-clay-600/80">
            <Check className="size-3" aria-hidden="true" />
            Saved to notebook
          </span>
        ) : null}
      </div>

      <Modal
        open={moveOpen}
        onOpenChange={setMoveOpen}
        title="Move note"
        description="Choose where this note lives."
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              size="md"
              disabled={note.folder_id === null}
              onClick={() => {
                saveNote({ id: note.id, input: { folder_id: null } })
                setMoveOpen(false)
              }}
            >
              Remove from folder
            </Button>
          </>
        }
      >
        <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-parchment-200 p-1">
          {folders.length === 0 ? (
            <p className="px-2 py-3 text-sm text-ink-400">No folders yet.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  saveNote({ id: note.id, input: { folder_id: folder.id } })
                  setMoveOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-parchment-100',
                  note.folder_id === folder.id ? 'font-medium text-clay-700' : 'text-ink-700',
                )}
              >
                <Bookmark className="size-4 shrink-0 text-clay-500" aria-hidden="true" />
                {folder.name}
                {note.folder_id === folder.id ? (
                  <Check className="ml-auto size-4 text-clay-600" aria-hidden="true" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </Modal>

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

function MenuRow({
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
