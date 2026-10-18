import { RefreshCw, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { isSummaryProcessing, type Summary } from '@/types/summary'

interface SummaryPanelProps {
  summary: Summary | undefined
  isLoading: boolean
  isError: boolean
  onClose: () => void
  onRetry: () => void
  onJumpToPage: (page: number) => void
}

export function SummaryPanel({
  summary,
  isLoading,
  isError,
  onClose,
  onRetry,
  onJumpToPage,
}: SummaryPanelProps) {
  const status = summary?.status ?? 'none'

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 shadow-[0_18px_40px_-24px_rgba(61,45,28,0.5)]">
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
        {isLoading && !summary ? (
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Spinner className="size-4" />
            Loading…
          </div>
        ) : isError ? (
          <ErrorState message="Couldn't load the summary." onRetry={onRetry} />
        ) : isSummaryProcessing(status) ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Spinner className="size-6" />
            <p className="text-sm font-medium text-ink-700">Summarizing…</p>
            <p className="max-w-xs text-sm text-ink-500">
              Reading the document and pulling out the key points. This can take a few seconds.
            </p>
          </div>
        ) : status === 'failed' ? (
          <ErrorState message={summary?.error ?? 'The summary failed.'} onRetry={onRetry} />
        ) : status === 'succeeded' && summary?.summary ? (
          <div className="space-y-6">
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
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-ink-500">Generate a summary of this document.</p>
            <Button size="md" onClick={onRetry}>
              <Sparkles className="size-4" aria-hidden="true" />
              Summarize
            </Button>
          </div>
        )}
      </div>
    </div>
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
