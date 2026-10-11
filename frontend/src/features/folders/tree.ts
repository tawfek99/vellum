import type { Folder } from '@/types/folder'

export interface FolderNode {
  folder: Folder
  children: FolderNode[]
}

/** Build a nested tree from a flat folder list (sorted by name at each level). */
export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const childrenByParent = new Map<string | null, Folder[]>()
  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parent_id) ?? []
    siblings.push(folder)
    childrenByParent.set(folder.parent_id, siblings)
  }

  const build = (parentId: string | null): FolderNode[] =>
    (childrenByParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => ({ folder, children: build(folder.id) }))

  return build(null)
}

/** All folder ids beneath `rootId` (excluding the root itself). */
export function collectDescendantIds(folders: Folder[], rootId: string): Set<string> {
  const childrenByParent = new Map<string | null, Folder[]>()
  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parent_id) ?? []
    siblings.push(folder)
    childrenByParent.set(folder.parent_id, siblings)
  }

  const result = new Set<string>()
  const walk = (id: string): void => {
    for (const child of childrenByParent.get(id) ?? []) {
      result.add(child.id)
      walk(child.id)
    }
  }
  walk(rootId)
  return result
}
