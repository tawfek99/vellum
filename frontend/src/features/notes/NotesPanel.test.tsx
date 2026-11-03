import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { NotesPanel } from '@/features/notes/NotesPanel'
import type { Note } from '@/types/note'

const mocks = vi.hoisted(() => ({
  useNotes: vi.fn(),
  useFolders: vi.fn(),
  useDocuments: vi.fn(),
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
vi.mock('@/hooks/useDocuments', () => ({
  useDocuments: mocks.useDocuments,
  useMoveDocument: () => ({ mutate: vi.fn() }),
  useUpdateDocument: () => ({ mutate: vi.fn() }),
  useDeleteDocument: () => ({ mutate: vi.fn() }),
}))

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

function document(id: string, title: string) {
  return {
    id,
    folder_id: 'f1',
    title,
    file_name: `${title}.pdf`,
    mime_type: 'application/pdf',
    file_size_bytes: 1024,
    page_count: 2,
    processing_status: 'ready' as const,
    error_message: null,
    created_at: '',
    updated_at: '',
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
    mocks.useDocuments.mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 50 },
      isLoading: false,
      isError: false,
    })
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

  it('shows documents filed in the selected folder', () => {
    setNotes([])
    mocks.useFolders.mockReturnValue({
      data: [
        {
          id: 'f1',
          name: 'Work',
          parent_id: null,
          note_count: 0,
          created_at: '',
          updated_at: '',
        },
      ],
    })
    mocks.useDocuments.mockReturnValue({
      data: { items: [document('d1', 'Filed report')], total: 1, page: 1, page_size: 50 },
      isLoading: false,
      isError: false,
    })

    render(
      <MemoryRouter initialEntries={['/notes?folder=f1']}>
        <NotesPanel />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('Filed report')).toBeInTheDocument()
  })
})
