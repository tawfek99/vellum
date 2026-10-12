import { Outlet } from 'react-router'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { AppDndProvider } from '@/features/dnd/AppDndProvider'

/**
 * Authenticated application shell: fixed sidebar + content column.
 * Wrapped in the drag-and-drop provider so notes (main area) can be dragged
 * onto folders (sidebar). Route protection lives in `RequireAuth`.
 */
export function AppShell() {
  return (
    <AppDndProvider>
      <div className="flex h-dvh bg-cream-100">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AppDndProvider>
  )
}
