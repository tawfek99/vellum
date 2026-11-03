import { apiFetch } from '@/lib/api/client'
import type { SearchResults } from '@/types/search'

export function searchAll(query: string, signal?: AbortSignal): Promise<SearchResults> {
  const params = new URLSearchParams({ q: query })
  return apiFetch<SearchResults>(`/search?${params.toString()}`, { signal })
}
