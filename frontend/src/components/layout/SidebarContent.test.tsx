import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { SidebarContent } from '@/components/layout/SidebarContent'

vi.mock('@/components/folders/FolderTree', () => ({ FolderTree: () => null }))

describe('SidebarContent', () => {
  it('renders the brand, primary navigation, and settings', () => {
    render(
      <MemoryRouter>
        <SidebarContent />
      </MemoryRouter>,
    )

    expect(screen.getByText('Vellum')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Notes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
})
