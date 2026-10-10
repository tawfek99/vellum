import { Outlet } from 'react-router'

import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

/**
 * Authenticated application shell: fixed sidebar + scrollable main column.
 * Route protection lives in `RequireAuth` (see the router).
 */
export function AppShell() {
  return (
    <div className="flex h-dvh bg-cream-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
