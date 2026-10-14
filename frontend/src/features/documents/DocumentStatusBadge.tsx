import { Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { DocumentStatus } from '@/types/document'

const BASE = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium'

export function DocumentStatusBadge({
  status,
  error,
}: {
  status: DocumentStatus
  error?: string | null
}) {
  if (status === 'ready') {
    return (
      <span className={cn(BASE, 'bg-sage-50 text-sage-600')}>
        <Check className="size-3" aria-hidden="true" />
        Ready
      </span>
    )
  }
  if (status === 'needs_ocr') {
    return (
      <span
        className={cn(BASE, 'bg-ochre-50 text-ochre-600')}
        title="Scanned PDF — no text layer. OCR isn't enabled yet."
      >
        Scanned PDF
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className={cn(BASE, 'bg-brick-50 text-brick-600')} title={error ?? undefined}>
        Failed
      </span>
    )
  }
  return (
    <span className={cn(BASE, 'bg-parchment-100 text-ink-500')}>
      <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      Processing…
    </span>
  )
}
