import type { MutableRefObject, Ref } from 'react'

/**
 * Combines multiple refs into one callback ref, so a single DOM node can be
 * referenced by several hooks (e.g. dnd-kit's droppable + draggable).
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as MutableRefObject<T | null>).current = node
    }
  }
}
