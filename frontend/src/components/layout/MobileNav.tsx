import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'

import { SidebarContent } from '@/components/layout/SidebarContent'

/**
 * Mobile navigation: a hamburger button that opens the sidebar as an accessible
 * drawer (Radix Dialog handles focus trapping, Escape, and ARIA).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500 lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-900/30 data-[state=open]:animate-[nav-overlay-in_150ms_ease-out] lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r border-parchment-200 bg-parchment-50 shadow-xl data-[state=open]:animate-[nav-panel-in_200ms_ease-out] lg:hidden">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Main navigation menu</Dialog.Description>

          <SidebarContent onNavigate={() => setOpen(false)} />

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-4 inline-flex size-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
