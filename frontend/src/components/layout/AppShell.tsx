import { Outlet } from 'react-router'

/**
 * Top-level application shell: header, main content area, and footer.
 *
 * The sidebar and authenticated navigation are added in Level 5. For now this
 * establishes the responsive layout skeleton that later screens plug into.
 */
export function AppShell() {
  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Note Taker
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-neutral-200 py-6">
        <div className="mx-auto w-full max-w-6xl px-4 text-xs text-neutral-500 sm:px-6">
          AI notes &amp; document manager
        </div>
      </footer>
    </div>
  )
}
