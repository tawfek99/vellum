import { Plus, Search } from 'lucide-react'

import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { useSession } from '@/features/auth/useSession'

/**
 * Application top bar: mobile nav trigger, search (placeholder), a "New" action
 * (enabled once note/document creation exists), and the user menu.
 */
export function TopBar() {
  const { user, loading } = useSession()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-parchment-200 bg-parchment-50/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />

      <div className="relative hidden w-full max-w-sm sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          disabled
          aria-label="Search"
          placeholder="Search (coming soon)"
          className="h-10 w-full rounded-full border border-parchment-200 bg-parchment-100/70 pl-9 pr-4 text-sm text-ink-700 placeholder:text-ink-400 disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled
          title="Creating notes and documents arrives in a later level"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-clay-600 px-3.5 text-sm font-medium text-parchment-50 opacity-60 sm:px-4"
        >
          <Plus className="size-4" aria-hidden="true" />
          New
        </button>

        {!loading && user ? <UserMenu user={user} /> : null}
      </div>
    </header>
  )
}
