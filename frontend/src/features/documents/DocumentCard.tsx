import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bookmark, FileText, FolderInput, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { InlineNameInput } from '@/components/folders/InlineNameInput'
import { FolderPickerDialog } from '@/components/folders/FolderPickerDialog'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DocumentStatusBadge } from '@/features/documents/DocumentStatusBadge'
import { useDeleteDocument, useUpdateDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { tiltFor } from '@/lib/paper'
import type { Document } from '@/types/document'
import type { Folder } from '@/types/folder'

interface DocumentCardProps {
  document: Document
  folderName?: string | null
  folders: Folder[]
}

export function DocumentCard({ document, folderName, folders }: DocumentCardProps) {
  const [renaming, setRenaming] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { mutate: update } = useUpdateDocument()
  const { mutate: remove } = useDeleteDocument()

  return (
    <article
      className="paper group"
      style={{ '--paper-tilt': `${tiltFor(document.id)}deg` } as CSSProperties}
    >
      <span className="paper__bg" aria-hidden="true" />
      <div className="paper__content flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-parchment-200/70 px-2 py-0.5 text-[11px] font-medium text-ink-600">
              <Bookmark className="size-3" aria-hidden="true" />
              {folderName ?? 'Unfiled'}
            </span>
            <DocumentStatusBadge
              status={document.processing_status}
              error={document.error_message}
            />
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${document.title}`}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-400 opacity-0 transition-opacity hover:bg-parchment-100 hover:text-ink-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-clay-500 group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                onCloseAutoFocus={(event) => event.preventDefault()}
                className="z-50 min-w-48 origin-top rounded-xl border border-parchment-200 bg-parchment-50 p-1.5 shadow-[0_16px_40px_-16px_rgba(61,45,28,0.35)] data-[state=open]:animate-[dropdown-in_140ms_ease-out]"
              >
                <MenuRow onSelect={() => setRenaming(true)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Rename
                </MenuRow>
                <MenuRow onSelect={() => setMoveOpen(true)}>
                  <FolderInput className="size-4" aria-hidden="true" />
                  Move to folder…
                </MenuRow>
                <DropdownMenu.Separator className="my-1 h-px bg-parchment-200" />
                <MenuRow danger onSelect={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </MenuRow>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-parchment-100 text-clay-600">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            {renaming ? (
              <InlineNameInput
                initialValue={document.title}
                ariaLabel={`Rename ${document.title}`}
                onSubmit={(title) => {
                  setRenaming(false)
                  if (title !== document.title) update({ id: document.id, input: { title } })
                }}
                onCancel={() => setRenaming(false)}
              />
            ) : (
              <h3 className="truncate font-serif text-base font-semibold text-ink-900">
                {document.title}
              </h3>
            )}
            <p className="mt-1 text-xs text-ink-400">
              {document.page_count > 0 ? `${document.page_count} pages · ` : ''}
              {formatBytes(document.file_size_bytes)}
            </p>
          </div>
        </div>
      </div>

      <FolderPickerDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        title="Move document"
        description={`Choose a folder for “${document.title}”.`}
        folders={folders}
        currentFolderId={document.folder_id}
        onSelect={(folderId) => update({ id: document.id, input: { folder_id: folderId } })}
      />

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete document?"
        description={`“${document.title}” and its extracted text will be removed.`}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                setDeleteOpen(false)
                remove(document.id)
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </article>
  )
}

function MenuRow({
  children,
  onSelect,
  danger,
}: {
  children: ReactNode
  onSelect: () => void
  danger?: boolean
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-parchment-100',
        danger
          ? 'text-brick-600 data-[highlighted]:text-brick-600'
          : 'text-ink-700 data-[highlighted]:text-ink-900',
      )}
    >
      {children}
    </DropdownMenu.Item>
  )
}
