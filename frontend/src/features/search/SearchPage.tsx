import type { CSSProperties } from 'react'
import { FileText, Search as SearchIcon, StickyNote, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useSearch } from '@/hooks/useSearch'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatRelative } from '@/lib/date'
import { tiltFor } from '@/lib/paper'
import type { SearchHit } from '@/types/search'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const debouncedQuery = useDebouncedValue(query, 250).trim()
  const { data, isLoading, isError, refetch } = useSearch(debouncedQuery)

  function updateQuery(value: string) {
    setParams(value ? { q: value } : {}, { replace: true })
  }

  const noteHits = data?.notes ?? []
  const documentHits = data?.documents ?? []
  const hasResults = noteHits.length > 0 || documentHits.length > 0

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">Search</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Find notes by title or content, and documents by title or extracted text.
        </p>
      </div>

      <form onSubmit={(event) => event.preventDefault()} role="search" className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          autoFocus
          aria-label="Search notes and documents"
          placeholder="Search notes and documents…"
          className="h-12 w-full rounded-2xl border border-parchment-200 bg-parchment-50 pl-11 pr-11 text-base text-ink-800 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20"
        />
        {query ? (
          <button
            type="button"
            onClick={() => updateQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-parchment-100 hover:text-ink-700"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </form>

      {query ? (
        isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
            <Spinner className="size-5" />
            Searching…
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn't search right now"
            description="Please try again."
            action={
              <Button variant="secondary" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : hasResults ? (
          <div className="space-y-8">
            {noteHits.length > 0 ? (
              <ResultSection title="Notes" hits={noteHits} query={query} />
            ) : null}
            {documentHits.length > 0 ? (
              <ResultSection title="Documents" hits={documentHits} query={query} />
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={`No matches for “${query}”`}
            description="Try a different word or a shorter phrase."
          />
        )
      ) : (
        <EmptyState
          icon={SearchIcon}
          title="Search your library"
          description="Start typing to search across all of your notes and documents."
        />
      )}
    </div>
  )
}

function ResultSection({
  title,
  hits,
  query,
}: {
  title: string
  hits: SearchHit[]
  query: string
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-baseline gap-2">
        <h2 className="font-serif text-lg font-semibold text-ink-900">{title}</h2>
        <span className="text-xs text-ink-400">{hits.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {hits.map((hit) => (
          <SearchResultCard key={hit.id} hit={hit} query={query} />
        ))}
      </div>
    </section>
  )
}

function SearchResultCard({ hit, query }: { hit: SearchHit; query: string }) {
  const isNote = hit.kind === 'note'
  const Icon = isNote ? StickyNote : FileText

  return (
    <Link
      to={isNote ? `/notes/${hit.id}` : `/documents/${hit.id}`}
      style={{ '--paper-tilt': `${tiltFor(hit.id)}deg` } as CSSProperties}
      className="paper group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
    >
      <span className="paper__bg" aria-hidden="true" />
      <div className="paper__content flex h-full flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
          <Icon className="size-3.5 text-clay-600" aria-hidden="true" />
          {isNote ? 'Note' : 'Document'}
          <span className="ml-auto normal-case tracking-normal">
            {formatRelative(hit.updated_at)}
          </span>
        </div>
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink-900">
          {hit.title}
        </h3>
        {hit.snippet ? (
          <p className="line-clamp-3 text-sm leading-6 text-ink-500">
            <HighlightedSnippet text={hit.snippet} query={query} />
          </p>
        ) : null}
      </div>
    </Link>
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const terms = query
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 1)
  if (terms.length === 0) return <>{text}</>

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  const matches = new Set(terms.map((term) => term.toLowerCase()))

  return (
    <>
      {text.split(pattern).map((part, index) =>
        matches.has(part.toLowerCase()) ? (
          <mark key={index} className="rounded-sm bg-clay-500/25 px-0.5 text-ink-900">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}
