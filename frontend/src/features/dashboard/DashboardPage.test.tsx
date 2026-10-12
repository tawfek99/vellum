import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { DashboardPage } from '@/features/dashboard/DashboardPage'

const mocks = vi.hoisted(() => ({ useSession: vi.fn(), useNotes: vi.fn(), useFolders: vi.fn() }))

vi.mock('@/features/auth/useSession', () => ({ useSession: mocks.useSession }))
vi.mock('@/hooks/useNotes', () => ({ useNotes: mocks.useNotes }))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mocks.useSession.mockReturnValue({
      session: null,
      user: { id: 'u1', email: 'ada@example.com' },
      loading: false,
    })
    mocks.useNotes.mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 5 },
      isLoading: false,
    })
    mocks.useFolders.mockReturnValue({ data: [], isLoading: false })
  })

  it('greets the user and shows the empty states', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /welcome back, ada/i })).toBeInTheDocument()
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no folders yet/i)).toBeInTheDocument()
  })

  it('lists recent notes', () => {
    mocks.useNotes.mockReturnValue({
      data: {
        items: [
          {
            id: 'n1',
            title: 'A recent note',
            content: '',
            folder_id: null,
            is_pinned: false,
            created_at: '',
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        page_size: 5,
      },
      isLoading: false,
    })

    renderPage()

    expect(screen.getByRole('link', { name: /a recent note/i })).toBeInTheDocument()
  })
})
