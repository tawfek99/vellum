import { createClient } from '@supabase/supabase-js'

import { env } from '@/config/env'

/**
 * Single Supabase client instance for the whole app.
 *
 * Only auth/storage client-side features use this. All business data goes
 * through the FastAPI backend. The publishable (anon) key is safe to expose.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
