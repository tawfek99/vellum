/**
 * Dashboard placeholder.
 *
 * Real content (recent notes/documents, quick actions) arrives in later levels.
 * For now it verifies routing, the query client, and the warm theme.
 */
export function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-heading" className="space-y-4">
      <div>
        <h1
          id="dashboard-heading"
          className="font-serif text-2xl font-semibold tracking-tight text-ink-900"
        >
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Foundation is in place. Notes, folders, and documents arrive in upcoming levels.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-parchment-300 bg-parchment-50 p-8 text-center">
        <p className="text-sm font-medium text-ink-700">Nothing here yet</p>
        <p className="mt-1 text-sm text-ink-500">
          This is the empty state placeholder for the dashboard.
        </p>
      </div>
    </section>
  )
}
