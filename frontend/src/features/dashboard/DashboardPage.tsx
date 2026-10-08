/**
 * Dashboard placeholder.
 *
 * Real content (recent notes/documents, quick actions) arrives in later levels.
 * For now it verifies routing, the query client, and Tailwind styling work.
 */
export function DashboardPage() {
  return (
    <section aria-labelledby="dashboard-heading" className="space-y-4">
      <div>
        <h1 id="dashboard-heading" className="text-2xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Foundation is in place. Notes, folders, and documents arrive in upcoming levels.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-neutral-700">Nothing here yet</p>
        <p className="mt-1 text-sm text-neutral-500">
          This is the empty state placeholder for the dashboard.
        </p>
      </div>
    </section>
  )
}
