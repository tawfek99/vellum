import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
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

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 1.15

const toolbarButton =
  'inline-flex size-8 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-clay-500'

export function DocumentViewPage() {
  const { id } = useParams<{ id: string }>()
  const { data: document, isLoading, isError } = useDocument(id)
  const content = useDocumentContent(id, Boolean(document))
  const foldersQuery = useFolders()
  const [fullscreen, setFullscreen] = useState(false)

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Documents</span>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-lg font-semibold text-ink-900">
            {document.title}
          </h1>
          <p className="truncate text-xs text-ink-400">
            {folderName ?? 'Unfiled'}
            {document.page_count > 0 ? ` · ${document.page_count} pages` : ''}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DocumentStatusBadge
            status={document.processing_status}
            error={document.error_message}
          />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="View full screen"
            className="inline-flex size-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
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
        <Banner tone="ink">Extracting text… the viewer is available while this finishes.</Banner>
      ) : null}

      {fullscreen ? null : content.isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-cream-100">
          <Spinner className="size-6" />
        </div>
      ) : content.isError || !url ? (
        <div className="flex flex-1 items-center justify-center rounded-xl bg-cream-100">
          <p className="text-sm text-brick-600">Couldn&apos;t load the PDF.</p>
        </div>
      ) : (
        <PdfViewer url={url} onToggleFullscreen={() => setFullscreen(true)} />
      )}

      {fullscreen && url ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-cream-100">
          <div className="flex items-center gap-3 border-b border-parchment-200 bg-parchment-50 px-4 py-2.5">
            <span className="truncate font-serif text-sm font-semibold text-ink-900">
              {document.title}
            </span>
            <span className="hidden text-xs text-ink-400 sm:inline">{folderName ?? 'Unfiled'}</span>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-clay-500"
            >
              <Minimize2 className="size-4" aria-hidden="true" />
              Exit full screen
            </button>
          </div>
          <div className="min-h-0 flex-1 p-3">
            <PdfViewer url={url} isFullscreen onToggleFullscreen={() => setFullscreen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function PdfViewer({
  url,
  isFullscreen,
  onToggleFullscreen,
}: {
  url: string
  isFullscreen?: boolean
  onToggleFullscreen: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef(new Map<number, HTMLDivElement>())

  const [containerWidth, setContainerWidth] = useState(0)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Fit the page to the available width, and re-fit on resize.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      if (width > 0) setContainerWidth(width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const pageWidth = containerWidth > 0 ? Math.max(200, (containerWidth - 32) * zoom) : undefined

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
    <div
      ref={containerRef}
      className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-cream-100"
    >
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-auto p-4">
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
            <p className="p-6 text-center text-sm text-brick-600">Couldn&apos;t render the PDF.</p>
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
                  <PdfPage pageNumber={index + 1} width={pageWidth} />
                </div>
              ))
            : null}
        </PdfDocument>
        {pdfError ? (
          <p className="mt-3 text-center text-xs text-brick-600">{pdfError}</p>
        ) : null}
      </div>

      {numPages > 0 ? (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-parchment-200 bg-parchment-50/95 px-2 py-1.5 shadow-[0_16px_36px_-18px_rgba(61,45,28,0.5)] backdrop-blur">
          <button
            type="button"
            className={toolbarButton}
            aria-label="Previous page"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-20 text-center text-xs font-medium text-ink-600">
            Page {page} / {numPages}
          </span>
          <button
            type="button"
            className={toolbarButton}
            aria-label="Next page"
            onClick={() => goToPage(page + 1)}
            disabled={page >= numPages}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          <span className="mx-1 h-5 w-px bg-parchment-200" aria-hidden="true" />

          <button
            type="button"
            className={toolbarButton}
            aria-label="Zoom out"
            onClick={() => setZoom((value) => Math.max(MIN_ZOOM, +(value / ZOOM_STEP).toFixed(2)))}
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <span className="w-11 text-center text-xs text-ink-500">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className={toolbarButton}
            aria-label="Zoom in"
            onClick={() => setZoom((value) => Math.min(MAX_ZOOM, +(value * ZOOM_STEP).toFixed(2)))}
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={toolbarButton}
            aria-label="Fit to width"
            onClick={() => setZoom(1)}
          >
            <Maximize className="size-4" aria-hidden="true" />
          </button>

          <span className="mx-1 h-5 w-px bg-parchment-200" aria-hidden="true" />

          <button
            type="button"
            className={toolbarButton}
            aria-label={isFullscreen ? 'Exit full screen' : 'View full screen'}
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function Banner({ children, tone }: { children: ReactNode; tone: 'ochre' | 'brick' | 'ink' }) {
  const toneClass = {
    ochre: 'border-ochre-600/25 bg-ochre-50 text-ochre-600',
    brick: 'border-brick-600/25 bg-brick-50 text-brick-600',
    ink: 'border-parchment-200 bg-parchment-50 text-ink-600',
  }[tone]
  return (
    <div className={cn('rounded-lg border px-3.5 py-2.5 text-sm', toneClass)}>{children}</div>
  )
}
