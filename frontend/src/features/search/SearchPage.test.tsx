import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { SearchPage } from '@/features/search/SearchPage'

const mocks = vi.hoisted(() => ({
  useSearch: vi.fn(),
}))

vi.mock('@/hooks/useSearch', () => ({ useSearch: mocks.useSearch }))

function renderPage(entry = '/search?q=alpha') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mockResults(notes: unknown[], documents: unknown[], query = 'alpha') {
    mocks.useSearch.mockReturnValue({
      data: { query, notes, documents },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
  }

  it('renders grouped note and document results with highlighted matches', () => {
    mockResults(
      [
        {
          kind: 'note',
          id: 'n1',
          title: 'Alpha plan',
          snippet: 'The alpha launch',
          updated_at: '',
        },
      ],
      [
        {
          kind: 'document',
          id: 'd1',
          title: 'Alpha report',
          snippet: 'alpha metrics',
          updated_at: '',
        },
      ],
    )

    renderPage()

    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByText('Alpha plan')).toBeInTheDocument()
    expect(screen.getByText('Alpha report')).toBeInTheDocument()

    const marked = screen
      .getAllByText(/alpha/i)
      .filter((element) => element.tagName === 'MARK')
    expect(marked.length).toBeGreaterThan(0)
  })

  it('shows the prompt before a query is entered', () => {
    mocks.useSearch.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage('/search')

    expect(screen.getByText(/search your library/i)).toBeInTheDocument()
  })

  it('shows a no-results state', () => {
    mockResults([], [], 'zebra')

    renderPage('/search?q=zebra')

    expect(screen.getByText(/no matches/i)).toBeInTheDocument()
  })
})
