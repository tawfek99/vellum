import { QueryClient } from '@tanstack/react-query'

/**
 * Shared TanStack Query client.
 *
 * Defaults chosen for a data-heavy app: refetching on window focus is disabled
 * (it causes surprising churn in an editor), queries are considered fresh for
 * 30s, and failed requests are retried once.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
