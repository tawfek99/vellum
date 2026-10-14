import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { FolderOpen, RotateCw, Upload } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { DocumentCard } from '@/features/documents/DocumentCard'
import { useDocuments, useUploadDocument } from '@/hooks/useDocuments'
import { useFolders } from '@/hooks/useFolders'

export function DocumentsPage() {
  const { data, isLoading, isError, refetch } = useDocuments({ pageSize: 50 })
  const foldersQuery = useFolders()
  const upload = useUploadDocument()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const documents = data?.items ?? []
  const folders = foldersQuery.data ?? []

  function handleFiles(files: File[]) {
    setError(null)
    const pdfs = files.filter((file) => file.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length === 0) {
      setError('Only PDF files are supported.')
      return
    }
    for (const file of pdfs) {
      upload.mutate(
        { file },
        { onError: (err) => setError(err instanceof Error ? err.message : 'Upload failed.') },
      )
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    handleFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <div
      className="relative flex h-full flex-col gap-6"
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">
            Documents
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {upload.isPending ? (
            <span className="text-xs text-ink-400">Uploading…</span>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              handleFiles(Array.from(event.target.files ?? []))
              event.target.value = ''
            }}
          />
          <Button size="md" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Upload PDF
          </Button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-brick-600/25 bg-brick-50 px-3.5 py-2.5 text-sm text-brick-600"
        >
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-parchment-200 bg-parchment-50 p-6 text-center">
            <p className="text-sm text-brick-600">Couldn&apos;t load documents.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-clay-600 hover:text-clay-700"
            >
              <RotateCw className="size-3.5" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <Dropzone onSelect={() => inputRef.current?.click()} />
        ) : (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                folderName={
                  document.folder_id
                    ? (folders.find((folder) => folder.id === document.folder_id)?.name ?? null)
                    : null
                }
                folders={folders}
              />
            ))}
          </div>
        )}
      </div>

      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-clay-600/10 ring-2 ring-clay-500/40 backdrop-blur-[1px]">
          <p className="flex items-center gap-2 rounded-xl bg-parchment-50 px-5 py-3 font-serif text-lg text-ink-800 shadow-[0_18px_40px_-18px_rgba(61,45,28,0.55)]">
            <Upload className="size-5 text-clay-600" aria-hidden="true" />
            Drop your PDF to upload
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Dropzone({ onSelect }: { onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-parchment-300 bg-parchment-50 px-6 py-12 text-center transition-colors hover:border-clay-400 hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
    >
      <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-parchment-100 text-clay-600">
        <FolderOpen className="size-6" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-ink-700">Drag &amp; drop a PDF here</span>
      <span className="text-sm text-ink-500">or click to browse your files</span>
    </button>
  )
}
