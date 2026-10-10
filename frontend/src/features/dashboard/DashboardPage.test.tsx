import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { DashboardPage } from '@/features/dashboard/DashboardPage'

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }))

vi.mock('@/features/auth/useSession', () => ({ useSession }))

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    useSession.mockReturnValue({
      session: null,
      user: { id: 'u1', email: 'ada@example.com' },
      loading: false,
    })
  })

  it('greets the user by name and shows the empty states', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /welcome back, ada/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
    expect(screen.getByText(/no folders yet/i)).toBeInTheDocument()
  })
})
