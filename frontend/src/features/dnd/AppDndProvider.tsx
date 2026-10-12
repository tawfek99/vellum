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
} from '@dnd-kit/core'

import { AppDndContext, type DragData } from '@/features/dnd/context'
import { collectDescendantIds } from '@/features/folders/tree'
import { useFolders, useMoveFolder } from '@/hooks/useFolders'
import { useMoveNote } from '@/hooks/useNotes'

/**
 * App-wide drag-and-drop: dragging a folder re-nests it, dragging a note files
 * it into the hovered folder. Kept at the shell level because the drag starts
 * in the main area and ends in the sidebar tree.
 */
export function AppDndProvider({ children }: { children: ReactNode }) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const { data: folders } = useFolders()
  const moveFolder = useMoveFolder()
  const moveNote = useMoveNote()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

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
    } else if (dragged.type === 'note') {
      moveNote.mutate({ id: dragged.id, folderId: dropFolderId })
    }
  }

  const value = useMemo(() => ({ activeDrag }), [activeDrag])

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
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.15)',
          }}
        >
          {activeDrag ? (
            <div className="inline-flex rotate-2 scale-[1.04] cursor-grabbing items-center rounded-xl border border-clay-500/40 bg-parchment-50 px-3.5 py-2 text-sm font-medium text-ink-800 shadow-[0_24px_46px_-18px_rgba(61,45,28,0.65)]">
              {activeDrag.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </AppDndContext.Provider>
  )
}
