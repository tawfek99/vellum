import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'

import { AppDndContext, type DragData } from '@/features/dnd/context'
import { collectDescendantIds } from '@/features/folders/tree'
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

/**
 * App-wide drag-and-drop: dragging a folder re-nests it, dragging a note files
 * it into the hovered folder. Kept at the shell level because the drag starts
 * in the main area and ends in the sidebar tree.
 */
export function AppDndProvider({ children }: { children: ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [dropPulse, setDropPulse] = useState<{ id: string; nonce: number } | null>(null)
  const { data: folders } = useFolders()
  const moveFolder = useMoveFolder()
  const moveNote = useMoveNote()

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
    }
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
        <DragOverlay
          modifiers={[snapToCursor]}
          dropAnimation={{
            duration: 220,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.15)',
          }}
        >
          {activeDrag ? (
            <div className="inline-flex max-w-64 rotate-2 scale-[1.03] cursor-grabbing items-center gap-2 rounded-xl border border-clay-500/40 bg-parchment-50 px-3 py-2 text-sm font-medium text-ink-800 shadow-[0_24px_46px_-18px_rgba(61,45,28,0.65)]">
              {activeDrag.type === 'folder' ? '📁' : '📝'}
              <span className="truncate">{activeDrag.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </AppDndContext.Provider>
  )
}
