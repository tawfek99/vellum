import { LibraryBig, NotebookText, Pin } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useSession } from '@/features/auth/useSession'
import { useNotes } from '@/hooks/useNotes'
import { formatRelative } from '@/lib/date'
import { getDisplayName } from '@/lib/user'

export function DashboardPage() {
  const { user } = useSession()
  const name = getDisplayName(user?.email, 'there')
  const { data, isLoading } = useNotes({ pageSize: 5 })
  const recent = data?.items ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-900">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening in your library.</p>
      </div>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="font-serif text-lg font-semibold text-ink-900">
            Recent notes
          </h2>
          <Link to="/notes" className="text-sm font-medium text-clay-600 hover:text-clay-700">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={NotebookText}
            title="No notes yet"
            description="Create a note and it will show up here."
          />
        ) : (
          <ul className="divide-y divide-parchment-200 overflow-hidden rounded-xl border border-parchment-200 bg-parchment-50">
            {recent.map((note) => (
              <li key={note.id}>
                <Link
                  to={`/notes/${note.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-clay-500"
                >
                  <NotebookText className="size-4 shrink-0 text-clay-600" aria-hidden="true" />
                  <span className="truncate text-sm font-medium text-ink-900">{note.title}</span>
                  {note.is_pinned ? (
                    <Pin
                      className="size-3.5 shrink-0 fill-clay-500 text-clay-500"
                      aria-label="Pinned"
                    />
                  ) : null}
                  <span className="ml-auto shrink-0 text-xs text-ink-400">
                    {formatRelative(note.updated_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="library-heading" className="space-y-3">
        <h2 id="library-heading" className="font-serif text-lg font-semibold text-ink-900">
          Your library
        </h2>
        <EmptyState
          icon={LibraryBig}
          title="No folders yet"
          description="Organize notes into folders from the sidebar."
        />
      </section>
    </div>
  )
}
