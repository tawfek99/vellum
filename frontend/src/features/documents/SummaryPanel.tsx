import { RefreshCw, Sparkles, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { DocumentStatus } from '@/types/document'
import { isSummaryProcessing, type Summary } from '@/types/summary'

interface SummaryPanelProps {
  summary: Summary | undefined
  isLoading: boolean
  isError: boolean
  documentStatus: DocumentStatus
  isRequesting: boolean
  requestError: string | null
  onClose: () => void
  onRetry: () => void
  onJumpToPage: (page: number) => void
}

export function SummaryPanel({
  summary,
  isLoading,
  isError,
  documentStatus,
  isRequesting,
  requestError,
  onClose,
  onRetry,
  onJumpToPage,
}: SummaryPanelProps) {
  const status = summary?.status ?? 'none'

  return (
    <div className="flex h-full animate-[panel-in_220ms_ease-out] flex-col gap-5 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 shadow-[0_18px_40px_-24px_rgba(61,45,28,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink-900">
            <Sparkles className="size-4 text-clay-600" aria-hidden="true" />
            Summary
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">AI-generated from this document</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close summary"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PanelBody
          status={status}
          summary={summary}
          isLoading={isLoading}
          isError={isError}
          documentStatus={documentStatus}
          isRequesting={isRequesting}
          requestError={requestError}
          onRetry={onRetry}
          onJumpToPage={onJumpToPage}
        />
      </div>
    </div>
  )
}

function PanelBody({
  status,
  summary,
  isLoading,
  isError,
  documentStatus,
  isRequesting,
  requestError,
  onRetry,
  onJumpToPage,
}: {
  status: Summary['status']
  summary: Summary | undefined
  isLoading: boolean
  isError: boolean
  documentStatus: DocumentStatus
  isRequesting: boolean
  requestError: string | null
  onRetry: () => void
  onJumpToPage: (page: number) => void
}) {
  if (documentStatus === 'needs_ocr') {
    return (
      <Notice tone="ochre">
        This looks like a <strong>scanned PDF</strong> — it has no text layer, so it can&apos;t be
        summarized yet. Reading the pages still works; text extraction would need OCR.
      </Notice>
    )
  }
  if (documentStatus === 'uploaded' || documentStatus === 'extracting') {
    return <ProgressState label="Still extracting text from this document…" />
  }
  if (documentStatus === 'failed') {
    return (
      <Notice tone="brick">
        Text extraction failed for this document, so it can&apos;t be summarized.
      </Notice>
    )
  }

  if (isError) return <ErrorState message="Couldn't load the summary." onRetry={onRetry} />
  if (isRequesting || isSummaryProcessing(status)) {
    return <ProgressState label="Reading the document and finding the key points…" />
  }
  if (status === 'failed') {
    return <ErrorState message={summary?.error ?? 'The summary failed.'} onRetry={onRetry} />
  }
  if (requestError) return <ErrorState message={requestError} onRetry={onRetry} />
  if (isLoading && !summary) return <ProgressState label="Loading…" />

  if (status === 'succeeded' && summary?.summary) {
    return (
      <div className="animate-[fade-in_260ms_ease-out] space-y-6">
        <p className="text-[15px] leading-7 text-ink-700">{summary.summary}</p>

        {summary.key_points.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Key points
            </h3>
            <ul className="mt-3 space-y-3">
              {summary.key_points.map((point, index) => (
                <li key={index} className="flex gap-2.5">
                  <span
                    className="mt-2.5 size-1.5 shrink-0 rounded-full bg-clay-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm leading-6 text-ink-700">{point.text}</p>
                    {point.page ? (
                      <button
                        type="button"
                        onClick={() => onJumpToPage(point.page as number)}
                        className="mt-1 text-xs font-medium text-clay-600 hover:text-clay-700"
                      >
                        p. {point.page}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="max-w-xs text-sm text-ink-500">
        Generate a clear summary with page-referenced key points.
      </p>
      <Button size="md" onClick={onRetry} disabled={isRequesting}>
        <Sparkles className="size-4" aria-hidden="true" />
        {isRequesting ? 'Summarizing…' : 'Summarize'}
      </Button>
    </div>
  )
}

function ProgressState({ label }: { label: string }) {
  return (
    <div className="space-y-5 py-6" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <Spinner className="size-4" />
        {label}
      </div>
      <div className="space-y-2.5">
        <div className="h-2.5 w-full animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-11/12 animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-4/5 animate-pulse rounded bg-parchment-200" />
        <div className="mt-4 h-2.5 w-1/3 animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-10/12 animate-pulse rounded bg-parchment-200" />
        <div className="h-2.5 w-9/12 animate-pulse rounded bg-parchment-200" />
      </div>
    </div>
  )
}

function Notice({ tone, children }: { tone: 'ochre' | 'brick'; children: ReactNode }) {
  const toneClass =
    tone === 'ochre'
      ? 'border-ochre-600/25 bg-ochre-50 text-ochre-600'
      : 'border-brick-600/25 bg-brick-50 text-brick-600'
  return (
    <div className={cn('rounded-lg border px-3.5 py-3 text-sm leading-6', toneClass)}>{children}</div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="max-w-xs text-sm text-brick-600">{message}</p>
      <Button size="md" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  )
}
