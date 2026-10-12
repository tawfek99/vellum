import { createContext, useContext } from 'react'

export interface DragData {
  type: 'folder' | 'note'
  id: string
  label: string
}

export interface DropPulse {
  id: string
  nonce: number
}

export interface AppDndValue {
  /** The item currently being dragged, if any (used to highlight drop targets). */
  activeDrag: DragData | null
  /** Briefly set after a successful drop so the target can confirm visually. */
  dropPulse: DropPulse | null
}

export const AppDndContext = createContext<AppDndValue>({
  activeDrag: null,
  dropPulse: null,
})

export function useAppDnd(): AppDndValue {
  return useContext(AppDndContext)
}
