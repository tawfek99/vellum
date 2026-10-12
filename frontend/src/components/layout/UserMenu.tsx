import type { User } from '@supabase/supabase-js'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, LogOut } from 'lucide-react'

import { Avatar } from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { getDisplayName } from '@/lib/user'

/** Profile menu: shows the signed-in user and offers sign out. */
export function UserMenu({ user }: { user: User }) {
  const name = getDisplayName(user.email, 'Account')

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-parchment-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
        >
          <Avatar email={user.email} />
          <span className="hidden text-sm font-medium text-ink-900 sm:inline">{name}</span>
          <ChevronDown className="size-4 text-ink-500" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[14rem] origin-top rounded-xl border border-parchment-200 bg-parchment-50 p-1.5 shadow-[0_16px_40px_-16px_rgba(61,45,28,0.35)] data-[state=open]:animate-[dropdown-in_140ms_ease-out]"
        >
          <DropdownMenu.Label className="px-2.5 py-1.5 text-xs text-ink-500">
            {user.email}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-parchment-200" />
          <DropdownMenu.Item
            onSelect={() => {
              void supabase.auth.signOut()
            }}
            className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-700 outline-none data-[highlighted]:bg-parchment-100 data-[highlighted]:text-ink-900"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
