import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { queryClient } from '@/lib/queryClient'

/**
 * Wraps the app in all global providers (query client today; auth/session and
 * theme providers are added in later levels). Keeping this in one place means
 * `main.tsx` stays trivial.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
