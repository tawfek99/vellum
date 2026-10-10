import { Clock, LibraryBig } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/ui/EmptyState'
import { useSession } from '@/features/auth/useSession'
import { getDisplayName } from '@/lib/user'

export function DashboardPage() {
  const { user } = useSession()
  const name = getDisplayName(user?.email, 'there')

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
            Recent activity
          </h2>
          <Link to="/notes" className="text-sm font-medium text-clay-600 hover:text-clay-700">
            View all
          </Link>
        </div>
        <EmptyState
          icon={Clock}
          title="Nothing here yet"
          description="Your recently opened notes and documents will appear here."
        />
      </section>

      <section aria-labelledby="library-heading" className="space-y-3">
        <h2 id="library-heading" className="font-serif text-lg font-semibold text-ink-900">
          Your library
        </h2>
        <EmptyState
          icon={LibraryBig}
          title="No folders yet"
          description="Folders and documents arrive in upcoming levels."
        />
      </section>
    </div>
  )
}
