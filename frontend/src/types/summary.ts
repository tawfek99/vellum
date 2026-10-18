/** Shared summary types (mirror the backend `SummaryRead` schema). */

export type SummaryStatus = 'none' | 'pending' | 'running' | 'succeeded' | 'failed'

export interface SummaryKeyPoint {
  text: string
  page: number | null
}

export interface Summary {
  id: string | null
  status: SummaryStatus
  summary: string | null
  key_points: SummaryKeyPoint[]
  error: string | null
}

export const isSummaryProcessing = (status: SummaryStatus): boolean =>
  status === 'pending' || status === 'running'
