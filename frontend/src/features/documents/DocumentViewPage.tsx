import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Document as PdfDocument, Page as PdfPage } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { Spinner } from '@/components/ui/Spinner'
import { DocumentStatusBadge } from '@/features/documents/DocumentStatusBadge'
import { useDocument, useDocumentContent } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'
import { cn } from '@/lib/cn'
import '@/lib/pdf'

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.15

const toolbarButton =
  'inline-flex size-8 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-clay-500'

export function DocumentViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading, isError } = useDocument(id)
  const content = useDocumentContent(id, Boolean(document))
  const foldersQuery = useFolders()

  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(1.1)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef(new Map<number, HTMLDivElement>())

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (isError || !document) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-serif text-xl font-semibold text-ink-900">Document not found</h1>
        <p className="mt-2 text-sm text-ink-500">It may have been deleted.</p>
        <Link
          to="/documents"
          className="mt-4 inline-block text-sm font-medium text-clay-600 hover:text-clay-700"
        >
          Back to documents
        </Link>
      </div>
    )
  }

  const folderName = document.folder_id
    ? (foldersQuery.data?.find((folder) => folder.id === document.folder_id)?.name ?? null)
    : null
  const isScanned = document.processing_status === 'needs_ocr'
  const isProcessing =
    document.processing_status === 'uploaded' || document.processing_status === 'extracting'
  const url = content.data?.url

  function goToPage(target: number) {
    const clamped = Math.min(Math.max(target, 1), numPages || 1)
    setPage(clamped)
    pageRefs.current.get(clamped)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleScroll() {
    const container = scrollRef.current
    if (!container) return
    const containerTop = container.getBoundingClientRect().top
    let current = 1
    for (const [number, element] of pageRefs.current) {
      if (element.getBoundingClientRect().top - containerTop <= 120) {
        current = Math.max(current, number)
      }
    }
    setPage(current)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Documents
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-xl font-semibold text-ink-900">
            {document.title}
          </h1>
          <p className="truncate text-xs text-ink-400">
            {folderName ?? 'Unfiled'}
            {document.page_count > 0 ? ` · ${document.page_count} pages` : ''}
          </p>
        </div>
        <div className="ml-auto">
          <DocumentStatusBadge
            status={document.processing_status}
            error={document.error_message}
          />
        </div>
      </div>

      {isScanned ? (
        <Banner tone="ochre">
          This looks like a scanned PDF — there&apos;s no text layer, so AI features need OCR
          (coming later). You can still read it below.
        </Banner>
      ) : null}
      {document.processing_status === 'failed' ? (
        <Banner tone="brick">
          Extraction failed: {document.error_message ?? 'unknown error'}
        </Banner>
      ) : null}
      {isProcessing ? (
        <Banner tone="ink">
          Extracting text… the viewer is available while this finishes.
        </Banner>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-parchment-200 bg-parchment-50 px-3 py-2">
        <button
          type="button"
          className={toolbarButton}
          aria-label="Previous page"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="min-w-20 text-center text-sm text-ink-600">
          Page {page}
          {numPages > 0 ? ` / ${numPages}` : ''}
        </span>
        <button
          type="button"
          className={toolbarButton}
          aria-label="Next page"
          onClick={() => goToPage(page + 1)}
          disabled={numPages > 0 && page >= numPages}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className={toolbarButton}
            aria-label="Zoom out"
            onClick={() => setScale((value) => Math.max(MIN_SCALE, +(value - SCALE_STEP).toFixed(2)))}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <span className="w-14 text-center text-xs text-ink-500">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className={toolbarButton}
            aria-label="Zoom in"
            onClick={() => setScale((value) => Math.min(MAX_SCALE, +(value + SCALE_STEP).toFixed(2)))}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-auto rounded-xl bg-cream-100 p-4"
      >
        {content.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : content.isError || !url ? (
          <p className="p-6 text-center text-sm text-brick-600">Couldn&apos;t load the PDF.</p>
        ) : (
          <>
            <PdfDocument
              file={url}
              onLoadSuccess={({ numPages: total }) => {
                setNumPages(total)
                setPage(1)
              }}
              onLoadError={(error) => setPdfError(error.message)}
              loading={
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="size-6" />
                </div>
              }
              error={
                <p className="p-6 text-center text-sm text-brick-600">
                  Couldn&apos;t render the PDF.
                </p>
              }
              className="flex flex-col items-center gap-4"
            >
              {numPages > 0
                ? Array.from({ length: numPages }, (_, index) => (
                    <div
                      key={index}
                      ref={(element) => {
                        if (element) pageRefs.current.set(index + 1, element)
                        else pageRefs.current.delete(index + 1)
                      }}
                      className="pdf-page"
                    >
                      <PdfPage pageNumber={index + 1} scale={scale} />
                    </div>
                  ))
                : null}
            </PdfDocument>
            {pdfError ? (
              <p className="mt-3 text-center text-xs text-brick-600">{pdfError}</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function Banner({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'ochre' | 'brick' | 'ink'
}) {
  const toneClass = {
    ochre: 'border-ochre-600/25 bg-ochre-50 text-ochre-600',
    brick: 'border-brick-600/25 bg-brick-50 text-brick-600',
    ink: 'border-parchment-200 bg-parchment-50 text-ink-600',
  }[tone]
  return (
    <div className={cn('rounded-lg border px-3.5 py-2.5 text-sm', toneClass)}>{children}</div>
  )
}
