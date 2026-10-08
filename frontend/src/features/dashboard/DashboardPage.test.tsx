import { render, screen } from '@testing-library/react'

import { DashboardPage } from '@/features/dashboard/DashboardPage'

describe('DashboardPage', () => {
  it('renders the dashboard heading and empty state', () => {
    render(<DashboardPage />)

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
  })
})
