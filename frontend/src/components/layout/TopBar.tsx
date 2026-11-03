import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router'

import { MobileNav } from '@/components/layout/MobileNav'
import { UserMenu } from '@/components/layout/UserMenu'
import { useSession } from '@/features/auth/useSession'

/**
 * Application top bar: mobile nav trigger, global search, a "New" action
 * (enabled once note/document creation exists), and the user menu.
 */
export function TopBar() {
  const { user, loading } = useSession()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-parchment-200 bg-parchment-50/90 px-4 backdrop-blur sm:px-6">
      <MobileNav />

      <form onSubmit={handleSearch} role="search" className="relative hidden w-full max-w-sm sm:block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search"
          placeholder="Search notes & documents…"
          className="h-10 w-full rounded-full border border-parchment-200 bg-parchment-100/70 pl-9 pr-4 text-sm text-ink-700 placeholder:text-ink-400 focus:border-clay-500 focus:bg-parchment-50 focus:outline-none focus:ring-2 focus:ring-clay-500/20"
        />
      </form>

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
