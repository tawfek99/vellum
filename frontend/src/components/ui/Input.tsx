import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/lib/cn'

/** Styled text input with the warm paper look and an accessible focus ring. */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-parchment-300 bg-parchment-50 px-3.5 py-2.5 text-sm text-ink-900',
        'placeholder:text-ink-400',
        'focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
