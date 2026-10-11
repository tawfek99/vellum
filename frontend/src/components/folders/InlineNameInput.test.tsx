import { fireEvent, render, screen } from '@testing-library/react'

import { InlineNameInput } from '@/components/folders/InlineNameInput'

describe('InlineNameInput', () => {
  it('pre-fills the current value', () => {
    render(
      <InlineNameInput
        initialValue="Work"
        ariaLabel="Rename Work"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Rename Work')).toHaveValue('Work')
  })

  it('submits a changed value on Enter', () => {
    const onSubmit = vi.fn()
    render(
      <InlineNameInput
        initialValue="Work"
        ariaLabel="Rename Work"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Rename Work')
    fireEvent.change(input, { target: { value: 'Work Stuff' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onSubmit).toHaveBeenCalledWith('Work Stuff')
  })

  it('does not submit when the value is unchanged', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    render(
      <InlineNameInput
        initialValue="Work"
        ariaLabel="Rename Work"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    )

    fireEvent.keyDown(screen.getByLabelText('Rename Work'), { key: 'Enter' })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('cancels on Escape', () => {
    const onCancel = vi.fn()
    render(
      <InlineNameInput
        initialValue="Work"
        ariaLabel="Rename Work"
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    )

    fireEvent.keyDown(screen.getByLabelText('Rename Work'), { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })
})
