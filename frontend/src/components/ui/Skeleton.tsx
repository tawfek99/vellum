import { cn } from '@/lib/cn'

/** A pulsing placeholder block for loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-parchment-200', className)} aria-hidden="true" />
  )
}
