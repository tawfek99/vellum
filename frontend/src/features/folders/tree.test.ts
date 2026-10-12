import { buildFolderTree, collectDescendantIds } from '@/features/folders/tree'
import type { Folder } from '@/types/folder'

function folder(id: string, name: string, parent_id: string | null = null): Folder {
  return { id, name, parent_id, note_count: 0, created_at: '', updated_at: '' }
}

describe('buildFolderTree', () => {
  it('nests children under parents and sorts siblings by name', () => {
    const tree = buildFolderTree([
      folder('a', 'Zeta'),
      folder('b', 'Alpha'),
      folder('c', 'Child', 'a'),
    ])

    expect(tree.map((node) => node.folder.name)).toEqual(['Alpha', 'Zeta'])
    expect(tree[1]?.children.map((node) => node.folder.name)).toEqual(['Child'])
  })
})

describe('collectDescendantIds', () => {
  it('returns every descendant but not the root or unrelated folders', () => {
    const ids = collectDescendantIds(
      [folder('a', 'A'), folder('b', 'B', 'a'), folder('c', 'C', 'b'), folder('d', 'D')],
      'a',
    )

    expect([...ids].sort()).toEqual(['b', 'c'])
  })
})
