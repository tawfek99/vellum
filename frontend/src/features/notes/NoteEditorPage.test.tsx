import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import { NoteEditorPage } from '@/features/notes/NoteEditorPage'

const mocks = vi.hoisted(() => ({
  useNote: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  useFolders: vi.fn(),
}))

vi.mock('@/hooks/useNotes', () => ({
  useNote: mocks.useNote,
  useUpdateNote: () => ({ mutate: mocks.save }),
  useDeleteNote: () => ({ mutate: mocks.remove }),
}))
vi.mock('@/hooks/useFolders', () => ({ useFolders: mocks.useFolders }))

// The editor flushes unsaved changes via the raw API on unmount; stub it out.
vi.mock('@/features/notes/api', () => ({
  updateNote: vi.fn(() => Promise.resolve({})),
}))

// TipTap/ProseMirror doesn't run in jsdom; stand in with a plain textarea.
vi.mock('@/components/notes/RichTextEditor', async () => {
  const React = await import('react')
  return {
    RichTextEditor: ({
      value,
      onChange,
    }: {
      value: string
      onChange: (markdown: string) => void
    }) => {
      const [text, setText] = React.useState(value)
      return React.createElement('textarea', {
        'aria-label': 'Note content',
        value: text,
        onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setText(event.target.value)
          onChange(event.target.value)
        },
      })
    },
  }
})

function renderEditor() {
  return render(
    <MemoryRouter initialEntries={['/notes/n1']}>
      <Routes>
        <Route path="/notes/:id" element={<NoteEditorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NoteEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useFolders.mockReturnValue({ data: [] })
    mocks.useNote.mockReturnValue({
      data: {
        id: 'n1',
        title: 'Original title',
        content: 'Original body',
        folder_id: null,
        is_pinned: false,
        created_at: '',
        updated_at: '',
      },
      isLoading: false,
      isError: false,
    })
  })

  it('shows the loaded note', () => {
    renderEditor()

    expect(screen.getByLabelText('Note title')).toHaveValue('Original title')
    expect(screen.getByLabelText('Note content')).toHaveValue('Original body')
  })

  it('autosaves after a pause in typing', () => {
    vi.useFakeTimers()
    try {
      renderEditor()

      fireEvent.change(screen.getByLabelText('Note title'), {
        target: { value: 'Updated title' },
      })

      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mocks.save).toHaveBeenCalledWith(
        { id: 'n1', input: { title: 'Updated title', content: 'Original body' } },
        expect.anything(),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('shows a not-found state when the note is missing', () => {
    mocks.useNote.mockReturnValue({ data: undefined, isLoading: false, isError: true })

    renderEditor()

    expect(screen.getByText(/note not found/i)).toBeInTheDocument()
  })
})
