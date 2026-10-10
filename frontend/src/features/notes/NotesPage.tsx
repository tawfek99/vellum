import { NotebookText } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'

export function NotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">Notes</h1>
        <p className="mt-1 text-sm text-ink-500">Create, edit, and organize your notes.</p>
      </div>
      <EmptyState
        icon={NotebookText}
        title="No notes yet"
        description="Note taking arrives in an upcoming level."
      />
    </div>
  )
}
