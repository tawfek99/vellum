import { Outlet, useMatch } from 'react-router'

import { NotesPanel } from '@/features/notes/NotesPanel'
import { cn } from '@/lib/cn'

/**
 * Split notes workspace: the notes grid on the left, the editor on the right
 * when a note is open. On small screens the editor replaces the grid.
 */
export function NotesWorkspace() {
  const noteMatch = useMatch('/notes/:id')
  const hasNote = noteMatch !== null

  return (
    <div className="flex h-full min-h-0 gap-6">
      <div className={cn('min-w-0', hasNote ? 'hidden w-80 shrink-0 lg:block lg:w-96' : 'flex-1')}>
        <NotesPanel />
      </div>

      {hasNote ? (
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      ) : null}
    </div>
  )
}
