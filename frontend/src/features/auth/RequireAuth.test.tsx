import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { RequireAuth } from '@/features/auth/RequireAuth'

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }))

vi.mock('@/features/auth/useSession', () => ({ useSession }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<div>protected content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('shows a loading state while the session resolves', () => {
    useSession.mockReturnValue({ session: null, user: null, loading: true })

    renderAt('/')

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    useSession.mockReturnValue({ session: null, user: null, loading: false })

    renderAt('/')

    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders protected content when authenticated', () => {
    useSession.mockReturnValue({
      session: null,
      user: { id: 'u1', email: 'ada@example.com' },
      loading: false,
    })

    renderAt('/')

    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
