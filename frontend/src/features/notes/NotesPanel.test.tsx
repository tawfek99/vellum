import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { NotesPanel } from '@/features/notes/NotesPanel'
import type { Note } from '@/types/note'

const mocks = vi.hoisted(() => ({
  useNotes: vi.fn(),
  useFolders: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/hooks/useNotes', () => ({
  useNotes: mocks.useNotes,
  useCreateNote: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateNote: () => ({ mutate: mocks.update }),
  useDeleteNote: () => ({ mutate: mocks.remove }),
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

function note(id: string, title: string): Note {
  return {
    id,
    title,
    content: 'body text',
    folder_id: null,
    is_pinned: false,
    created_at: '',
    updated_at: new Date().toISOString(),
  }
}

function setNotes(items: Note[]) {
  mocks.useNotes.mockReturnValue({
    data: { items, total: items.length, page: 1, page_size: 50 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <NotesPanel />
    </MemoryRouter>,
  )
}

describe('NotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useFolders.mockReturnValue({ data: [] })
  })

  it('lists notes as cards', () => {
    setNotes([note('n1', 'First note')])

    renderPanel()

    expect(screen.getByRole('link', { name: /first note/i })).toBeInTheDocument()
  })

  it('shows an empty state with no notes', () => {
    setNotes([])

    renderPanel()

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('creates a note from the header action', () => {
    setNotes([])

    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'New' }))

    expect(mocks.create).toHaveBeenCalled()
  })
})
