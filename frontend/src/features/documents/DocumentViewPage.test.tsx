import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { DocumentViewPage } from '@/features/documents/DocumentViewPage'
import type { Document } from '@/types/document'

const mocks = vi.hoisted(() => ({
  useDocument: vi.fn(),
  useDocumentContent: vi.fn(),
  useFolders: vi.fn(),
}))

vi.mock('@/lib/pdf', () => ({}))
vi.mock('react-pdf', async () => {
  const React = await import('react')
  return {
    Document: ({
      children,
      onLoadSuccess,
    }: {
      children?: ReactNode
      onLoadSuccess?: (data: { numPages: number }) => void
    }) => {
      const called = React.useRef(false)
      React.useEffect(() => {
        if (!called.current) {
          called.current = true
          onLoadSuccess?.({ numPages: 2 })
        }
      }, [onLoadSuccess])
      return React.createElement('div', { 'data-testid': 'pdf-document' }, children)
    },
    Page: ({ pageNumber }: { pageNumber: number }) =>
      React.createElement('div', null, `PDF page ${pageNumber}`),
    pdfjs: { GlobalWorkerOptions: {} },
  }
})
vi.mock('@/hooks/useDocuments', () => ({
  useDocument: mocks.useDocument,
  useDocumentContent: mocks.useDocumentContent,
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

function document_(status: Document['processing_status']): Document {
  return {
    id: 'd1',
    folder_id: null,
    title: 'Report',
    file_name: 'Report.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 2048,
    page_count: 2,
    processing_status: status,
    error_message: null,
    created_at: '',
    updated_at: '',
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/documents/d1']}>
      <Routes>
        <Route path="/documents/:id" element={<DocumentViewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('DocumentViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useFolders.mockReturnValue({ data: [] })
    mocks.useDocumentContent.mockReturnValue({
      data: { url: 'https://example.test/pdf', expires_in: 3600 },
      isLoading: false,
      isError: false,
    })
  })

  it('renders the PDF pages when ready', async () => {
    mocks.useDocument.mockReturnValue({ data: document_('ready'), isLoading: false, isError: false })

    renderPage()

    expect(await screen.findByText('PDF page 1')).toBeInTheDocument()
    expect(screen.getByText('PDF page 2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Report' })).toBeInTheDocument()
  })

  it('shows the scanned notice for needs_ocr', () => {
    mocks.useDocument.mockReturnValue({
      data: document_('needs_ocr'),
      isLoading: false,
      isError: false,
    })

    renderPage()

    expect(screen.getByText(/no text layer/i)).toBeInTheDocument()
  })

  it('shows the processing state', () => {
    mocks.useDocument.mockReturnValue({
      data: document_('uploaded'),
      isLoading: false,
      isError: false,
    })

    renderPage()

    expect(screen.getByText(/extracting text/i)).toBeInTheDocument()
  })

  it('shows a not-found state', () => {
    mocks.useDocument.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    renderPage()

    expect(screen.getByText(/document not found/i)).toBeInTheDocument()
  })
})
