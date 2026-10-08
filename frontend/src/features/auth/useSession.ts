import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export interface UseSessionResult {
  session: Session | null
  user: Session['user'] | null
  loading: boolean
}

/**
 * Tracks the current Supabase auth session.
 *
 * Subscribes to auth changes first, then reads the persisted session, so no
 * event is missed during startup. Safe under React StrictMode (effect cleanup
 * unsubscribes and ignores late results).
 */
export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(false)
    })

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return
      setSession(sessionData.session)
      setLoading(false)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { session, user: session?.user ?? null, loading }
}
