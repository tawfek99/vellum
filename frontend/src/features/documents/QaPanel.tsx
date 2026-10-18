import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { MessageCircle, RefreshCw, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import type { DocumentStatus } from '@/types/document'
import { isQaProcessing, type QaExchange, type QaHistory } from '@/types/qa'

const SUGGESTIONS = [
  'What is this document about?',
  'Summarize the main points',
  'What are the key dates or numbers?',
]

interface QaPanelProps {
  history: QaHistory | undefined
  isLoading: boolean
  isError: boolean
  documentStatus: DocumentStatus
  isAsking: boolean
  askError: string | null
  onAsk: (question: string) => void
  onClose: () => void
  onJumpToPage: (page: number) => void
  onRetry: () => void
}

export function QaPanel({
  history,
  isLoading,
  isError,
  documentStatus,
  isAsking,
  askError,
  onAsk,
  onClose,
  onJumpToPage,
  onRetry,
}: QaPanelProps) {
  const items = history?.items ?? []
  const processing = isAsking || items.some((item) => isQaProcessing(item.status))
  const [question, setQuestion] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastStatus = items.at(-1)?.status

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
    } else {
      element.scrollTop = element.scrollHeight
    }
  }, [items.length, lastStatus, isAsking])

  function submit(text: string) {
    const cleaned = text.trim()
    if (!cleaned || processing) return
    onAsk(cleaned)
    setQuestion('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(question)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit(question)
    }
  }

  return (
    <div className="flex h-full animate-[panel-in_220ms_ease-out] flex-col gap-4 rounded-2xl border border-parchment-200 bg-parchment-50 p-6 shadow-[0_18px_40px_-24px_rgba(61,45,28,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink-900">
            <MessageCircle className="size-4 text-clay-600" aria-hidden="true" />
            Ask this document
          </h2>
          <p className="mt-0.5 text-xs text-ink-400">Grounded answers with page references</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Q&A"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {documentStatus === 'needs_ocr' ? (
        <Notice tone="ochre">
          This looks like a <strong>scanned PDF</strong> — it has no text layer, so questions
          can&apos;t be answered yet. Reading the pages still works; text extraction would need
          OCR.
        </Notice>
      ) : documentStatus === 'uploaded' || documentStatus === 'extracting' ? (
        <ProgressState label="Still extracting text from this document…" />
      ) : documentStatus === 'failed' ? (
        <Notice tone="brick">
          Text extraction failed for this document, so questions can&apos;t be answered.
        </Notice>
      ) : (
        <>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
            {isError ? (
              <ErrorState message="Couldn't load the conversation." onRetry={onRetry} />
            ) : isLoading && !history ? (
              <ProgressState label="Loading…" />
            ) : items.length === 0 ? (
              <EmptyState disabled={processing} onPick={submit} />
            ) : (
              <ul className="space-y-4" aria-live="polite">
                {items.map((exchange) => (
                  <ExchangeItem
                    key={exchange.id}
                    exchange={exchange}
                    onJumpToPage={onJumpToPage}
                  />
                ))}
                {isAsking ? (
                  <li className="mr-auto inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-parchment-200 bg-cream-50 px-4 py-3 text-sm text-ink-500">
                    <Spinner className="size-4" />
                    Sending…
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          {askError ? (
            <p className="rounded-lg border border-brick-600/25 bg-brick-50 px-3 py-2 text-xs text-brick-600">
              {askError}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <label htmlFor="qa-question" className="sr-only">
              Ask a question about this document
            </label>
            <textarea
              id="qa-question"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ask a question…"
              className="min-h-11 flex-1 resize-none rounded-xl border border-parchment-200 bg-cream-50 px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={processing || question.trim().length === 0}
              aria-label="Send question"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-clay-600 text-cream-50 transition-colors hover:bg-clay-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
          <p className="text-[11px] text-ink-400">
            Enter to send · Shift+Enter for a new line
          </p>
        </>
      )}
    </div>
  )
}

function ExchangeItem({
  exchange,
  onJumpToPage,
}: {
  exchange: QaExchange
  onJumpToPage: (page: number) => void
}) {
  return (
    <li className="space-y-2.5">
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-clay-600/10 px-4 py-2.5 text-sm leading-6 text-ink-800">
        {exchange.question}
      </div>

      {exchange.status === 'succeeded' && exchange.answer ? (
        <div className="mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-parchment-200 bg-cream-50 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-ink-700">
            {exchange.answer}
          </p>
          {exchange.pages.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {exchange.pages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onJumpToPage(page)}
                  className="rounded-full border border-clay-600/25 px-2 py-0.5 text-[11px] font-medium text-clay-700 transition-colors hover:bg-clay-600/10"
                >
                  p. {page}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : exchange.status === 'failed' ? (
        <div className="mr-auto max-w-[92%] rounded-2xl rounded-bl-md border border-brick-600/25 bg-brick-50 px-4 py-3 text-sm leading-6 text-brick-600">
          {exchange.error ?? "Couldn't answer that one. Please try again."}
        </div>
      ) : (
        <div
          className="mr-auto inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-parchment-200 bg-cream-50 px-4 py-3 text-sm text-ink-500"
          aria-live="polite"
        >
          <Spinner className="size-4" />
          Reading the document…
        </div>
      )}
    </li>
  )
}

function EmptyState({
  disabled,
  onPick,
}: {
  disabled: boolean
  onPick: (question: string) => void
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
      <span className="rounded-full bg-clay-600/10 p-3">
        <MessageCircle className="size-5 text-clay-600" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink-700">Ask anything about this document</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-ink-500">
          Answers are grounded in the document, with page references.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onPick(suggestion)}
            className="rounded-full border border-parchment-200 bg-cream-50 px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-clay-300 hover:text-clay-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
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
    <div className={cn('rounded-lg border px-3.5 py-3 text-sm leading-6', toneClass)}>
      {children}
    </div>
  )
}

function ProgressState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-sm font-medium text-ink-700" aria-live="polite">
      <Spinner className="size-4" />
      {label}
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
