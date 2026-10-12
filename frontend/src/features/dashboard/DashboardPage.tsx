import { LibraryBig, NotebookText } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/features/auth/useSession'
import { NoteCard } from '@/features/notes/NoteCard'
import { useFolders } from '@/hooks/useFolders'
import { useNotes } from '@/hooks/useNotes'
import { getDisplayName } from '@/lib/user'

export function DashboardPage() {
  const { user } = useSession()
  const name = getDisplayName(user?.email, 'there')
  const { data: notesData, isLoading: notesLoading } = useNotes({ pageSize: 6 })
  const { data: foldersData, isLoading: foldersLoading } = useFolders()

  const recent = notesData?.items ?? []
  const folders = foldersData ?? []
  const folderNameById = new Map(folders.map((folder) => [folder.id, folder.name]))
  const roots = folders.filter((folder) => folder.parent_id === null)

  return (
    <div className="h-full space-y-10 overflow-y-auto pr-1">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-900">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s on your desk.</p>
      </div>

      <section aria-labelledby="recent-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="font-serif text-lg font-semibold text-ink-900">
            Recent activity
          </h2>
          <Link to="/notes" className="text-sm font-medium text-clay-600 hover:text-clay-700">
            View all
          </Link>
        </div>

        {notesLoading ? (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={NotebookText}
            title="No notes yet"
            description="Create a note and it will show up here."
          />
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]">
            {recent.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folderName={
                  note.folder_id ? (folderNameById.get(note.folder_id) ?? null) : null
                }
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="library-heading" className="space-y-4">
        <h2 id="library-heading" className="font-serif text-lg font-semibold text-ink-900">
          Your library
        </h2>

        {foldersLoading ? (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : roots.length === 0 ? (
          <EmptyState
            icon={LibraryBig}
            title="No folders yet"
            description="Organize notes into folders from the sidebar."
          />
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(12rem,1fr))]">
            {roots.map((folder) => (
              <Link
                key={folder.id}
                to={`/notes?folder=${folder.id}`}
                className="group flex flex-col gap-6 rounded-2xl border border-parchment-200 bg-parchment-50 p-4 shadow-[0_12px_26px_-18px_rgba(61,45,28,0.55)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_36px_-20px_rgba(61,45,28,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-clay-600/10 text-clay-600">
                  <LibraryBig className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-serif text-base font-semibold text-ink-900">{folder.name}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {folder.note_count} {folder.note_count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
