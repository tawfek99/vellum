import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { LoginPage } from '@/features/auth/LoginPage'

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword } },
}))
vi.mock('@/config/env', () => ({
  env: { demoEmail: 'demo@example.com', demoPassword: 'demo-pass' },
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
  })

  it('renders the welcome heading and sign-in form', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('submits the entered credentials', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'secret123',
      }),
    )
  })

  it('shows an error message when sign-in fails', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not sign you in/i)
  })

  it('signs into the demo account with one click', async () => {
    signInWithPassword.mockResolvedValue({ error: null })
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /try the demo/i }))

    await waitFor(() =>
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'demo@example.com',
        password: 'demo-pass',
      }),
    )
  })

  it('shows an error if the demo is unavailable', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'boom' } })
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: /try the demo/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/demo is unavailable/i)
  })
})
