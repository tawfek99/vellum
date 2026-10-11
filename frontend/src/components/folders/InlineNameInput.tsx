import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

interface InlineNameInputProps {
  initialValue?: string
  ariaLabel: string
  placeholder?: string
  className?: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

/**
 * Inline text input used to create or rename a folder.
 * Enter (or blur with a value) commits; Escape (or blur when empty) cancels.
 */
export function InlineNameInput({
  initialValue = '',
  ariaLabel,
  placeholder = 'Folder name',
  className,
  onSubmit,
  onCancel,
}: InlineNameInputProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function finish(submit: boolean) {
    if (finished.current) return
    finished.current = true
    const trimmed = value.trim()
    if (submit && trimmed) onSubmit(trimmed)
    else onCancel()
  }

  return (
    <input
      ref={inputRef}
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          finish(true)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          finish(false)
        }
      }}
      onBlur={() => finish(true)}
      className={cn(
        'w-full min-w-0 rounded-md border border-clay-400/60 bg-parchment-50 px-2 py-1 text-sm text-ink-900',
        'placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/25',
        className,
      )}
    />
  )
}
