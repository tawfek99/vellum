import { createContext, useContext } from 'react'

export interface DragData {
  type: 'folder' | 'note'
  id: string
  label: string
}

export interface AppDndValue {
  /** The item currently being dragged, if any (used to highlight drop targets). */
  activeDrag: DragData | null
}

export const AppDndContext = createContext<AppDndValue>({ activeDrag: null })

export function useAppDnd(): AppDndValue {
  return useContext(AppDndContext)
}
