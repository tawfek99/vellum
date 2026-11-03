import { useQuery } from '@tanstack/react-query'

import { searchAll } from '@/features/search/api'

/** Search notes + documents; disabled for blank queries. */
export function useSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: ({ signal }) => searchAll(trimmed, signal),
    enabled: trimmed.length > 0,
  })
}
