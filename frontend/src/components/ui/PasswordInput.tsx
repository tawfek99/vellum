import { useState } from 'react'
import type { ComponentPropsWithRef } from 'react'

import { cn } from '@/lib/cn'
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons'
import { Input } from '@/components/ui/Input'

/** Password input with an accessible show/hide toggle. */
export function PasswordInput({ className, ...props }: ComponentPropsWithRef<'input'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pr-11', className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className={cn(
          'absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-400',
          'hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-clay-500',
        )}
      >
        {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  )
}
