import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type Over,
} from '@dnd-kit/core'

import { AppDndContext, type DragData } from '@/features/dnd/context'
import { collectDescendantIds } from '@/features/folders/tree'
import { useMoveDocument } from '@/hooks/useDocuments'
import { useFolders, useMoveFolder } from '@/hooks/useFolders'
import { useMoveNote } from '@/hooks/useNotes'

/**
 * Keeps the drag overlay pinned to the exact pointer grab point so the ghost
 * sits under the cursor instead of floating at the card's original position.
 */
const snapToCursor: Modifier = ({ transform, activatorEvent, activeNodeRect }) => {
  const event = activatorEvent as PointerEvent | undefined
  if (!event || typeof event.clientX !== 'number' || !activeNodeRect) return transform
  return {
    ...transform,
    x: transform.x - (activeNodeRect.left - event.clientX),
    y: transform.y - (activeNodeRect.top - event.clientY),
  }
}

interface SuckGhost {
  id: string
  label: string
  type: DragData['type']
  left: number
  top: number
  width: number
  height: number
  dx: number
  dy: number
  nonce: number
}

/**
 * App-wide drag-and-drop: dragging a folder re-nests it, dragging a note files
 * it into the hovered folder. Kept at the shell level because the drag starts
 * in the main area and ends in the sidebar tree.
 */
export function AppDndProvider({ children }: { children: ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [dropPulse, setDropPulse] = useState<{ id: string; nonce: number } | null>(null)
  const [suckGhost, setSuckGhost] = useState<SuckGhost | null>(null)
  const { data: folders } = useFolders()
  const moveFolder = useMoveFolder()
  const moveNote = useMoveNote()
  const moveDocument = useMoveDocument()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  function pulse(id: string) {
    const nonce = Date.now()
    setDropPulse({ id, nonce })
    window.setTimeout(() => {
      setDropPulse((current) => (current?.nonce === nonce ? null : current))
    }, 720)
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined
    if (data) setActiveDrag(data)
  }

  /** Animate a ghost of the dragged item into the folder it was dropped on. */
  function playSuck(active: Active, over: Over, dragged: DragData) {
    const translated = active.rect.current.translated
    if (!translated) return

    const dx = over.rect.left + over.rect.width / 2 - (translated.left + translated.width / 2)
    const dy = over.rect.top + over.rect.height / 2 - (translated.top + translated.height / 2)
    const nonce = Date.now()
    setSuckGhost({
      id: dragged.id,
      label: dragged.label,
      type: dragged.type,
      left: translated.left,
      top: translated.top,
      width: translated.width,
      height: translated.height,
      dx,
      dy,
      nonce,
    })
    window.setTimeout(() => {
      setSuckGhost((current) => (current?.nonce === nonce ? null : current))
    }, 420)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) return

    const dragged = active.data.current as DragData | undefined
    if (!dragged) return

    const dropFolderId = (over.data.current?.folderId ?? null) as string | null

    if (dragged.type === 'folder') {
      if (dragged.id === dropFolderId) return
      const descendants = collectDescendantIds(folders ?? [], dragged.id)
      if (dropFolderId && descendants.has(dropFolderId)) return
      moveFolder.mutate({ id: dragged.id, parentId: dropFolderId })
      pulse(dropFolderId ?? 'root')
    } else if (dragged.type === 'note') {
      moveNote.mutate({ id: dragged.id, folderId: dropFolderId })
      pulse(dropFolderId ?? 'root')
    } else if (dragged.type === 'document') {
      moveDocument.mutate({ id: dragged.id, folderId: dropFolderId })
      pulse(dropFolderId ?? 'root')
    }

    playSuck(active, over, dragged)
  }

  const value = useMemo(() => ({ activeDrag, dropPulse }), [activeDrag, dropPulse])

  return (
    <AppDndContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        {children}
        <DragOverlay modifiers={[snapToCursor]} dropAnimation={null}>
          {activeDrag ? (
            <div className="inline-flex max-w-64 rotate-2 scale-[1.03] cursor-grabbing items-center gap-2 rounded-xl border border-clay-500/40 bg-parchment-50 px-3 py-2 text-sm font-medium text-ink-800 shadow-[0_24px_46px_-18px_rgba(61,45,28,0.65)]">
              {activeDrag.type === 'folder' ? '📁' : activeDrag.type === 'note' ? '📝' : '📄'}
              <span className="truncate">{activeDrag.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {suckGhost ? (
        <div
          key={suckGhost.nonce}
          aria-hidden="true"
          className="suck-ghost pointer-events-none fixed z-[100]"
          style={
            {
              left: suckGhost.left,
              top: suckGhost.top,
              width: suckGhost.width,
              height: suckGhost.height,
              '--suck-x': `${suckGhost.dx}px`,
              '--suck-y': `${suckGhost.dy}px`,
            } as CSSProperties
          }
        >
          <div className="flex h-full w-full items-center gap-2 rounded-xl border border-clay-500/40 bg-parchment-50 px-3 py-2 text-sm font-medium text-ink-800 shadow-[0_24px_46px_-18px_rgba(61,45,28,0.65)]">
            <span>
              {suckGhost.type === 'folder' ? '📁' : suckGhost.type === 'note' ? '📝' : '📄'}
            </span>
            <span className="truncate">{suckGhost.label}</span>
          </div>
        </div>
      ) : null}
    </AppDndContext.Provider>
  )
}
