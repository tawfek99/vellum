import { useState } from 'react'
import { NotebookText, Plus, RotateCw, Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { NoteListItem } from '@/features/notes/NoteListItem'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useFolders } from '@/hooks/useFolders'
import { useCreateNote, useNotes } from '@/hooks/useNotes'

export function NotesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const folderId = searchParams.get('folder')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading, isError, refetch } = useNotes({
    folderId,
    search: debouncedSearch,
    pageSize: 50,
  })
  const foldersQuery = useFolders()
  const createNote = useCreateNote()

  const folders = foldersQuery.data ?? []
  const folderName = folders.find((folder) => folder.id === folderId)?.name ?? null
  const notes = data?.items ?? []

  function handleNewNote() {
    createNote.mutate(
      { title: 'Untitled', folder_id: folderId },
      { onSuccess: (note) => navigate(`/notes/${note.id}`) },
    )
  }

  function handleFolderFilter(value: string) {
    setSearchParams(value ? { folder: value } : {})
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">
            {folderName ?? 'Notes'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {folderName ? 'Notes filed in this folder.' : 'All of your notes.'}
          </p>
        </div>
        <Button size="md" onClick={handleNewNote} disabled={createNote.isPending}>
          <Plus className="size-4" aria-hidden="true" />
          New note
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="h-10 w-full rounded-lg border border-parchment-300 bg-parchment-50 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/25"
          />
        </div>
        <select
          value={folderId ?? ''}
          onChange={(event) => handleFolderFilter(event.target.value)}
          aria-label="Filter by folder"
          className="h-10 rounded-lg border border-parchment-300 bg-parchment-50 px-3 text-sm text-ink-900 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/25"
        >
          <option value="">All folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-parchment-200 bg-parchment-50 p-6 text-center">
          <p className="text-sm text-brick-600">Couldn&apos;t load notes.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-clay-600 hover:text-clay-700"
          >
            <RotateCw className="size-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title={debouncedSearch ? 'No matching notes' : 'No notes yet'}
          description={
            debouncedSearch
              ? 'Try a different search term.'
              : 'Create your first note to get started.'
          }
          action={
            debouncedSearch ? undefined : (
              <Button size="md" onClick={handleNewNote}>
                <Plus className="size-4" aria-hidden="true" />
                New note
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              folderName={
                note.folder_id
                  ? (folders.find((folder) => folder.id === note.folder_id)?.name ?? null)
                  : null
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
