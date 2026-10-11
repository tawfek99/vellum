import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

/** Accessible modal built on Radix Dialog, styled for the warm theme. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/30 data-[state=open]:animate-[nav-overlay-in_150ms_ease-out]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border border-parchment-200 bg-parchment-50 p-6 shadow-[0_24px_60px_-30px_rgba(61,45,28,0.5)]',
            'focus:outline-none',
            className,
          )}
        >
          <Dialog.Title className="font-serif text-lg font-semibold tracking-tight text-ink-900">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1.5 text-sm text-ink-500">
              {description}
            </Dialog.Description>
          ) : null}

          {children ? <div className="mt-4">{children}</div> : null}

          {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
