import { fireEvent, render, screen } from '@testing-library/react'

import { FolderTree } from '@/components/folders/FolderTree'
import type { Folder } from '@/types/folder'

const mocks = vi.hoisted(() => ({
  useFolders: vi.fn(),
  create: vi.fn(),
  rename: vi.fn(),
  move: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/hooks/useFolders', () => ({
  useFolders: mocks.useFolders,
  useCreateFolder: () => ({ mutate: mocks.create, error: null }),
  useRenameFolder: () => ({ mutate: mocks.rename, error: null }),
  useMoveFolder: () => ({ mutate: mocks.move, error: null }),
  useDeleteFolder: () => ({ mutate: mocks.remove, error: null }),
}))

function folder(id: string, name: string, parent_id: string | null = null): Folder {
  return { id, name, parent_id, created_at: '', updated_at: '' }
}

function setFolders(data: Folder[]) {
  mocks.useFolders.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
}

function toggleLibrary() {
  fireEvent.click(screen.getByRole('button', { name: 'My Library' }))
}

describe('FolderTree', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('only shows the new-folder action when the library is expanded', () => {
    setFolders([])

    render(<FolderTree />)

    // Collapsed by default: no new-folder action, no empty state.
    expect(screen.queryByRole('button', { name: 'New folder' })).not.toBeInTheDocument()
    expect(screen.queryByText(/no folders yet/i)).not.toBeInTheDocument()

    toggleLibrary()

    expect(screen.getByRole('button', { name: 'New folder' })).toBeInTheDocument()
    expect(screen.getByText(/no folders yet/i)).toBeInTheDocument()
  })

  it('renders a nested tree and reveals children when expanded', () => {
    setFolders([folder('a', 'Work'), folder('b', 'Research', 'a')])

    render(<FolderTree />)
    toggleLibrary()

    expect(screen.getByText('Work')).toBeInTheDocument()
    expect(screen.queryByText('Research')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /expand work/i }))

    expect(screen.getByText('Research')).toBeInTheDocument()
  })

  it('creates a root folder from the inline input', () => {
    setFolders([])

    render(<FolderTree />)
    toggleLibrary()

    fireEvent.click(screen.getByRole('button', { name: 'New folder' }))
    const input = screen.getByLabelText('New folder name')
    fireEvent.change(input, { target: { value: 'Ideas' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mocks.create).toHaveBeenCalledWith({ name: 'Ideas', parent_id: null })
  })
})
