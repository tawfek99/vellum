import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { DocumentViewPage } from '@/features/documents/DocumentViewPage'
import type { Document } from '@/types/document'
import type { QaHistory } from '@/types/qa'

const mocks = vi.hoisted(() => ({
  useDocument: vi.fn(),
  useDocumentContent: vi.fn(),
  useFolders: vi.fn(),
  useQa: vi.fn(),
  useAskQuestion: vi.fn(),
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
  useSummary: () => ({ data: { status: 'none' }, isLoading: false, isError: false }),
  useCreateSummary: () => ({ mutate: vi.fn() }),
  useQa: mocks.useQa,
  useAskQuestion: mocks.useAskQuestion,
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

// jsdom has no layout; give the viewer a measurable width.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 800,
  })
})

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
    mocks.useQa.mockReturnValue({
      data: { items: [] } satisfies QaHistory,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })
    mocks.useAskQuestion.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: null,
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

  it('opens the Q&A panel and sends a question', () => {
    mocks.useDocument.mockReturnValue({
      data: document_('ready'),
      isLoading: false,
      isError: false,
    })
    const mutate = vi.fn()
    mocks.useAskQuestion.mockReturnValue({ mutate, isPending: false, error: null })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /ask/i }))
    expect(screen.getByText(/ask anything about this document/i)).toBeInTheDocument()

    const input = screen.getByLabelText(/ask a question about this document/i)
    fireEvent.change(input, { target: { value: 'What is this about?' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mutate).toHaveBeenCalledWith({ id: 'd1', question: 'What is this about?' })
  })

  it('renders Q&A history with page citations', () => {
    mocks.useDocument.mockReturnValue({
      data: document_('ready'),
      isLoading: false,
      isError: false,
    })
    mocks.useQa.mockReturnValue({
      data: {
        items: [
          {
            id: 'q1',
            question: 'What is the goal?',
            answer: 'To ship a working product.',
            status: 'succeeded',
            error: null,
            pages: [2],
            created_at: '',
          },
        ],
      } satisfies QaHistory,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /ask/i }))

    expect(screen.getByText('What is the goal?')).toBeInTheDocument()
    expect(screen.getByText('To ship a working product.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'p. 2' })).toBeInTheDocument()
  })
})
