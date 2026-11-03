/** Shared global-search types (mirror the backend `SearchResults` schema). */

export type SearchKind = 'note' | 'document'

export interface SearchHit {
  kind: SearchKind
  id: string
  title: string
  snippet: string
  updated_at: string
}

export interface SearchResults {
  query: string
  notes: SearchHit[]
  documents: SearchHit[]
}
