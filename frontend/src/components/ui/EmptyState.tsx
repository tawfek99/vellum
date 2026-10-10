import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Consistent empty-state block used across list/detail screens. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment-300 bg-parchment-50 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-parchment-100 text-clay-600">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      ) : null}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
