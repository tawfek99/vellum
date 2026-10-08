import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-clay-600 text-parchment-50 shadow-sm hover:bg-clay-700 focus-visible:outline-clay-600',
  secondary:
    'border border-parchment-300 bg-parchment-50 text-ink-900 hover:bg-parchment-100 focus-visible:outline-clay-500',
  ghost: 'text-ink-700 hover:bg-parchment-100 focus-visible:outline-clay-500',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  className,
  variant = 'primary',
  size = 'lg',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
