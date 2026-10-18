/** Shared Q&A types (mirror the backend `QaExchangeRead` schema). */

export type QaStatus = 'pending' | 'running' | 'succeeded' | 'failed'

export interface QaExchange {
  id: string
  question: string
  answer: string | null
  status: QaStatus
  error: string | null
  pages: number[]
  created_at: string
}

export interface QaHistory {
  items: QaExchange[]
}

export const isQaProcessing = (status: QaStatus): boolean =>
  status === 'pending' || status === 'running'
