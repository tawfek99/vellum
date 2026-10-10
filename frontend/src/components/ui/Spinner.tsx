import { cn } from '@/lib/cn'

/** Accessible loading spinner. Renders a `role="status"` region for a11y. */
export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)}>
      <svg
        className="size-5 animate-spin text-clay-600"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z"
        />
      </svg>
    </span>
  )
}

/** Full-viewport centered spinner, used while auth state resolves. */
export function FullPageSpinner() {
  return (
    <div className="flex h-dvh items-center justify-center bg-cream-100">
      <Spinner className="size-6" />
    </div>
  )
}
