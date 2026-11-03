import { LogOut } from 'lucide-react'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useSession } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import { getDisplayName } from '@/lib/user'

export function SettingsPage() {
  const { user } = useSession()

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
          <p className="mt-1 text-sm text-ink-500">Manage your account.</p>
        </div>

      <section className="rounded-xl border border-parchment-200 bg-parchment-50 p-5">
        <h2 className="text-sm font-medium text-ink-900">Account</h2>
        <div className="mt-4 flex items-center gap-3">
          <Avatar email={user?.email} className="size-10" />
          <div>
            <p className="text-sm font-medium text-ink-900">
              {getDisplayName(user?.email, 'Account')}
            </p>
            <p className="text-sm text-ink-500">{user?.email ?? 'Not signed in'}</p>
          </div>
        </div>
        <div className="mt-5">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              void supabase.auth.signOut()
            }}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </section>
      </div>
    </div>
  )
}
