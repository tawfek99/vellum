import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  MoreHorizontal,
  Plus,
  RotateCw,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { InlineNameInput } from '@/components/folders/InlineNameInput'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAppDnd, type DragData } from '@/features/dnd/context'
import {
  buildFolderTree,
  collectDescendantIds,
  type FolderNode as FolderNodeData,
} from '@/features/folders/tree'
import {
  useCreateFolder,
  useDeleteFolder,
  useFolders,
  useMoveFolder,
  useRenameFolder,
} from '@/hooks/useFolders'
import { cn } from '@/lib/cn'
import { mergeRefs } from '@/lib/mergeRefs'
import type { Folder } from '@/types/folder'

// Shared drag data for folders and the root droppable.
const folderDragData = (folder: Folder): DragData => ({
  type: 'folder',
  id: folder.id,
  label: folder.name,
})

interface FolderTreeActions {
  expanded: Set<string>
  toggleExpanded: (id: string) => void
  selectedId: string | null
  openFolder: (id: string) => void
  renamingId: string | null
  startRename: (folder: Folder) => void
  cancelRename: () => void
  commitRename: (folder: Folder, name: string) => void
  isCreating: boolean
  creatingParentId: string | null
  startCreate: (parentId: string | null) => void
  cancelCreate: () => void
  commitCreate: (name: string) => void
  openDelete: (folder: Folder) => void
  openMove: (folder: Folder) => void
}

const FolderTreeContext = createContext<FolderTreeActions | null>(null)

function useTreeActions(): FolderTreeActions {
  const value = useContext(FolderTreeContext)
  if (!value) throw new Error('FolderTreeContext is missing')
  return value
}

function flattenWithDepth(
  nodes: FolderNodeData[],
  depth = 0,
): Array<{ folder: Folder; depth: number }> {
  return nodes.flatMap((node) => [
    { folder: node.folder, depth },
    ...flattenWithDepth(node.children, depth + 1),
  ])
}

/** Sidebar section: a fully interactive, nested, drag-and-droppable folder tree. */
export function FolderTree() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('folder')

  const { data, isLoading, isError, refetch } = useFolders()
  const createMutation = useCreateFolder()
  const renameMutation = useRenameFolder()
  const moveMutation = useMoveFolder()
  const deleteMutation = useDeleteFolder()

  const [libraryOpen, setLibraryOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creatingParentId, setCreatingParentId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null)
  const [moveTarget, setMoveTarget] = useState<Folder | null>(null)
  const [moveDestination, setMoveDestination] = useState<string | null>(null)

  const folders = useMemo(() => data ?? [], [data])
  const tree = useMemo(() => buildFolderTree(folders), [folders])

  const error =
    createMutation.error ?? renameMutation.error ?? moveMutation.error ?? deleteMutation.error

  const actions: FolderTreeActions = {
    expanded,
    toggleExpanded: (id) =>
      setExpanded((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
    selectedId,
    openFolder: (id) => navigate(`/notes?folder=${id}`),
    renamingId,
    startRename: (folder) => setRenamingId(folder.id),
    cancelRename: () => setRenamingId(null),
    commitRename: (folder, name) => {
      setRenamingId(null)
      if (name !== folder.name) renameMutation.mutate({ id: folder.id, name })
    },
    isCreating,
    creatingParentId,
    startCreate: (parentId) => {
      setIsCreating(true)
      setCreatingParentId(parentId)
      if (parentId) setExpanded((prev) => new Set(prev).add(parentId))
    },
    cancelCreate: () => {
      setIsCreating(false)
      setCreatingParentId(null)
    },
    commitCreate: (name) => {
      const parentId = creatingParentId
      setIsCreating(false)
      setCreatingParentId(null)
      createMutation.mutate({ name, parent_id: parentId })
    },
    openDelete: setDeleteTarget,
    openMove: (folder) => {
      setMoveTarget(folder)
      setMoveDestination(folder.parent_id)
    },
  }

  const moveOptions = useMemo(() => {
    if (!moveTarget) return []
    const excluded = collectDescendantIds(folders, moveTarget.id)
    excluded.add(moveTarget.id)
    return flattenWithDepth(tree).filter(({ folder }) => !excluded.has(folder.id))
  }, [moveTarget, folders, tree])

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setLibraryOpen((open) => !open)}
        aria-expanded={libraryOpen}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
      >
        <ChevronRight
          className={cn(
            'size-4 shrink-0 text-ink-400 transition-transform',
            libraryOpen && 'rotate-90',
          )}
          aria-hidden="true"
        />
        My Library
      </button>

      {libraryOpen ? (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => actions.startCreate(null)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-600 transition-colors hover:bg-parchment-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
          >
            <Plus className="size-4 shrink-0 text-clay-600" aria-hidden="true" />
            New folder
          </button>

          {isLoading ? (
            <div className="space-y-1.5 px-3 py-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="ml-4 h-6 w-28" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : isError ? (
            <div className="px-3 py-2">
              <p className="text-xs text-brick-600">Couldn&apos;t load folders.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-clay-600 hover:text-clay-700"
              >
                <RotateCw className="size-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : (
            <FolderTreeContext.Provider value={actions}>
              <RootDropZone>
                {isCreating && creatingParentId === null ? (
                  <div className="px-2 py-0.5">
                    <InlineNameInput
                      ariaLabel="New folder name"
                      onSubmit={actions.commitCreate}
                      onCancel={actions.cancelCreate}
                    />
                  </div>
                ) : null}

                {tree.map((node) => (
                  <FolderNode key={node.folder.id} node={node} depth={0} />
                ))}

                {!isCreating && tree.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-ink-400">No folders yet.</p>
                ) : null}
              </RootDropZone>
            </FolderTreeContext.Provider>
          )}

          {error ? (
            <p role="alert" className="px-3 pt-2 text-xs text-brick-600">
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </p>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete folder?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be deleted. Its subfolders move up to the parent and its notes become unfiled.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                const target = deleteTarget
                setDeleteTarget(null)
                if (target) deleteMutation.mutate(target.id)
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <Modal
        open={moveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null)
        }}
        title="Move folder"
        description={moveTarget ? `Choose a new location for “${moveTarget.name}”.` : undefined}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button
              size="md"
              disabled={!moveTarget || moveDestination === moveTarget.parent_id}
              onClick={() => {
                const target = moveTarget
                setMoveTarget(null)
                if (target) moveMutation.mutate({ id: target.id, parentId: moveDestination })
              }}
            >
              Move here
            </Button>
          </>
        }
      >
        <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-parchment-200 p-1">
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-700 hover:bg-parchment-100">
            <input
              type="radio"
              name="move-destination"
              className="accent-clay-600"
              checked={moveDestination === null}
              onChange={() => setMoveDestination(null)}
            />
            My Library (root)
          </label>
          {moveOptions.map(({ folder, depth }) => (
            <label
              key={folder.id}
              className="flex cursor-pointer items-center gap-2 rounded-md py-1.5 pr-2 text-sm text-ink-700 hover:bg-parchment-100"
              style={{ paddingLeft: depth * 14 + 8 }}
            >
              <input
                type="radio"
                name="move-destination"
                className="accent-clay-600"
                checked={moveDestination === folder.id}
                onChange={() => setMoveDestination(folder.id)}
              />
              <FolderIcon className="size-4 shrink-0 text-clay-500" aria-hidden="true" />
              {folder.name}
            </label>
          ))}
        </div>
      </Modal>
    </div>
  )
}

/** Droppable area that represents the library root (un-nesting / unfiling). */
function RootDropZone({ children }: { children: ReactNode }) {
  const { activeDrag } = useAppDnd()
  const { setNodeRef, isOver } = useDroppable({
    id: 'folder-drop-root',
    data: { folderId: null },
  })

  const highlight = isOver && activeDrag !== null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-8 space-y-0.5 rounded-lg transition-colors',
        highlight && 'bg-clay-600/10 ring-1 ring-clay-500/40',
      )}
    >
      {children}
    </div>
  )
}

function FolderNode({ node, depth }: { node: FolderNodeData; depth: number }) {
  const a = useTreeActions()
  const { activeDrag } = useAppDnd()
  const { folder, children } = node
  const hasChildren = children.length > 0
  const isExpanded = a.expanded.has(folder.id)
  const isSelected = a.selectedId === folder.id
  const isRenaming = a.renamingId === folder.id
  const isCreatingChild = a.isCreating && a.creatingParentId === folder.id

  const isDragging = activeDrag?.type === 'folder' && activeDrag.id === folder.id

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: { folderId: folder.id },
  })
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({
    id: `folder-drag-${folder.id}`,
    data: folderDragData(folder),
    disabled: isRenaming,
  })

  const canDropHere =
    activeDrag !== null &&
    activeDrag.id !== folder.id &&
    !(activeDrag.type === 'folder' && children.some((child) => child.folder.id === activeDrag.id))
  const dropHighlight = isOver && canDropHere

  return (
    <li>
      <div
        ref={mergeRefs(setDropRef, setDragRef)}
        {...attributes}
        {...listeners}
        className={cn(
          'group flex items-center gap-0.5 rounded-lg pr-0.5 transition-colors',
          isSelected ? 'bg-parchment-200' : 'hover:bg-parchment-100',
          dropHighlight && 'bg-clay-600/15 ring-1 ring-clay-500/50',
          isDragging && 'opacity-40',
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => a.toggleExpanded(folder.id)}
            aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
            aria-expanded={isExpanded}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-ink-400 transition-colors hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-clay-500"
          >
            <ChevronRight
              className={cn('size-4 transition-transform', isExpanded && 'rotate-90')}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" aria-hidden="true" />
        )}

        {isRenaming ? (
          <div className="min-w-0 flex-1 py-0.5 pr-1">
            <InlineNameInput
              initialValue={folder.name}
              ariaLabel={`Rename ${folder.name}`}
              onSubmit={(name) => a.commitRename(folder, name)}
              onCancel={a.cancelRename}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => a.openFolder(folder.id)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-1 text-left text-sm text-ink-700 focus-visible:outline-2 focus-visible:outline-clay-500"
          >
            {isExpanded && hasChildren ? (
              <FolderOpen className="size-4 shrink-0 text-clay-500" aria-hidden="true" />
            ) : (
              <FolderIcon className="size-4 shrink-0 text-clay-500" aria-hidden="true" />
            )}
            <span className="truncate">{folder.name}</span>
          </button>
        )}

        <FolderMenuButton folder={folder} />
      </div>

      {isCreatingChild ? (
        <div className="py-0.5" style={{ paddingLeft: (depth + 1) * 12 + 6 }}>
          <InlineNameInput
            ariaLabel="New subfolder name"
            onSubmit={a.commitCreate}
            onCancel={a.cancelCreate}
          />
        </div>
      ) : null}

      {hasChildren && isExpanded ? (
        <ul className="space-y-0.5">
          {children.map((child) => (
            <FolderNode key={child.folder.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function FolderMenuButton({ folder }: { folder: Folder }) {
  const a = useTreeActions()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={`Actions for ${folder.name}`}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded text-ink-400 opacity-0 transition-opacity hover:text-ink-700 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-clay-500 group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="z-50 min-w-44 rounded-xl border border-parchment-200 bg-parchment-50 p-1.5 shadow-[0_16px_40px_-16px_rgba(61,45,28,0.35)]"
        >
          <MenuItem onSelect={() => a.startCreate(folder.id)}>New subfolder</MenuItem>
          <MenuItem onSelect={() => a.startRename(folder)}>Rename</MenuItem>
          <MenuItem onSelect={() => a.openMove(folder)}>Move to…</MenuItem>
          <DropdownMenu.Separator className="my-1 h-px bg-parchment-200" />
          <MenuItem danger onSelect={() => a.openDelete(folder)}>
            Delete
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function MenuItem({
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
        'cursor-pointer select-none rounded-lg px-2.5 py-1.5 text-sm outline-none data-[highlighted]:bg-parchment-100',
        danger
          ? 'text-brick-600 data-[highlighted]:text-brick-600'
          : 'text-ink-700 data-[highlighted]:text-ink-900',
      )}
    >
      {children}
    </DropdownMenu.Item>
  )
}
