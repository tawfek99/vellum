import { Link, Outlet } from 'react-router'

import { useSession } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'

/**
 * Top-level application shell: header, main content area, and footer.
 *
 * The sidebar and route guards are added in Level 5. For now the header shows
 * a sign-in link or the signed-in user with a sign-out action.
 */
export function AppShell() {
  const { user, loading } = useSession()

  return (
    <div className="flex min-h-full flex-col bg-cream-100">
      <header className="border-b border-parchment-200 bg-parchment-50">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <span className="font-serif text-sm font-semibold tracking-tight text-ink-900">
            Note Taker
          </span>

          <div className="ml-auto flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <span className="hidden text-xs text-ink-500 sm:inline">{user.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    void supabase.auth.signOut()
                  }}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-clay-600 hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-parchment-200 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-xs text-ink-500 sm:px-6">
          AI notes &amp; document manager
        </div>
      </footer>
    </div>
  )
}
