import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { NotesPage } from '@/features/notes/NotesPage'
import type { Note } from '@/types/note'

const mocks = vi.hoisted(() => ({
  useNotes: vi.fn(),
  useFolders: vi.fn(),
  create: vi.fn(),
}))

vi.mock('@/hooks/useNotes', () => ({
  useNotes: mocks.useNotes,
  useCreateNote: () => ({ mutate: mocks.create, isPending: false }),
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

function note(id: string, title: string): Note {
  return {
    id,
    title,
    content: 'body',
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

function renderPage() {
  return render(
    <MemoryRouter>
      <NotesPage />
    </MemoryRouter>,
  )
}

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useFolders.mockReturnValue({ data: [] })
  })

  it('lists notes', () => {
    setNotes([note('n1', 'First note')])

    renderPage()

    expect(screen.getByRole('link', { name: 'First note' })).toBeInTheDocument()
  })

  it('shows an empty state with no notes', () => {
    setNotes([])

    renderPage()

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
  })

  it('creates a new note', () => {
    setNotes([])

    renderPage()
    const [headerNewNote] = screen.getAllByRole('button', { name: /new note/i })
    fireEvent.click(headerNewNote as HTMLElement)

    expect(mocks.create).toHaveBeenCalled()
  })
})
