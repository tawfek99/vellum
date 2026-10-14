import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import { DocumentsPage } from '@/features/documents/DocumentsPage'
import type { Document } from '@/types/document'

const mocks = vi.hoisted(() => ({
  useDocuments: vi.fn(),
  upload: vi.fn(),
  useFolders: vi.fn(),
}))

vi.mock('@/hooks/useDocuments', () => ({
  useDocuments: mocks.useDocuments,
  useUploadDocument: () => ({ mutate: mocks.upload, isPending: false }),
  useUpdateDocument: () => ({ mutate: mocks.upload }),
  useDeleteDocument: () => ({ mutate: mocks.upload }),
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

function document_(id: string, title: string, status: Document['processing_status']): Document {
  return {
    id,
    folder_id: null,
    title,
    file_name: `${title}.pdf`,
    mime_type: 'application/pdf',
    file_size_bytes: 1024,
    page_count: 2,
    processing_status: status,
    error_message: null,
    created_at: '',
    updated_at: '',
  }
}

function setDocuments(items: Document[]) {
  mocks.useDocuments.mockReturnValue({
    data: { items, total: items.length, page: 1, page_size: 50 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DocumentsPage />
    </MemoryRouter>,
  )
}

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useFolders.mockReturnValue({ data: [] })
  })

  it('shows a dropzone when there are no documents', () => {
    setDocuments([])

    renderPage()

    expect(screen.getByText(/drag & drop a pdf/i)).toBeInTheDocument()
  })

  it('lists documents with a status badge', () => {
    setDocuments([document_('d1', 'Report', 'ready')])

    renderPage()

    expect(screen.getByText('Report')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('flags scanned PDFs', () => {
    setDocuments([document_('d2', 'Scan', 'needs_ocr')])

    renderPage()

    expect(screen.getByText('Scanned PDF')).toBeInTheDocument()
  })

  it('uploads a selected PDF', () => {
    setDocuments([])

    const { container } = renderPage()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(mocks.upload).toHaveBeenCalled()
  })

  it('rejects non-PDF files', () => {
    setDocuments([])

    const { container } = renderPage()
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole('alert')).toHaveTextContent(/only pdf/i)
  })
})
