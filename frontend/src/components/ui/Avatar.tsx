import { cn } from '@/lib/cn'
import { getInitials } from '@/lib/user'

interface AvatarProps {
  name?: string | null
  email?: string | null
  className?: string
}

/** Initials avatar (no image upload yet). Decorative; pair with a visible name. */
export function Avatar({ name, email, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-clay-600 text-xs font-semibold text-parchment-50',
        className,
      )}
    >
      {getInitials(name ?? email ?? '')}
    </span>
  )
}
