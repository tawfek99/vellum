import { Files } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'

export function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">Documents</h1>
        <p className="mt-1 text-sm text-ink-500">Upload and study PDF documents.</p>
      </div>
      <EmptyState
        icon={Files}
        title="No documents yet"
        description="PDF upload and viewing arrive in upcoming levels."
      />
    </div>
  )
}
