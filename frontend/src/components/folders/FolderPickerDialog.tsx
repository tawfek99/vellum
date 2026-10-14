import { Bookmark, Check } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import type { Folder } from '@/types/folder'

interface FolderPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  folders: Folder[]
  currentFolderId: string | null
  onSelect: (folderId: string | null) => void
}

/** Reusable "move to folder" picker (used for documents/notes). */
export function FolderPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  folders,
  currentFolderId,
  onSelect,
}: FolderPickerDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="md"
            disabled={currentFolderId === null}
            onClick={() => {
              onSelect(null)
              onOpenChange(false)
            }}
          >
            Remove from folder
          </Button>
        </>
      }
    >
      <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-parchment-200 p-1">
        {folders.length === 0 ? (
          <p className="px-2 py-3 text-sm text-ink-400">No folders yet.</p>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => {
                onSelect(folder.id)
                onOpenChange(false)
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-parchment-100',
                currentFolderId === folder.id ? 'font-medium text-clay-700' : 'text-ink-700',
              )}
            >
              <Bookmark className="size-4 shrink-0 text-clay-500" aria-hidden="true" />
              {folder.name}
              {currentFolderId === folder.id ? (
                <Check className="ml-auto size-4 text-clay-600" aria-hidden="true" />
              ) : null}
            </button>
          ))
        )}
      </div>
    </Modal>
  )
}
