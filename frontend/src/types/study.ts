/** Shared flashcard/quiz types (mirror the backend study schemas). */

export type StudyStatus = 'none' | 'pending' | 'running' | 'succeeded' | 'failed'

export interface Flashcard {
  front: string
  back: string
}

export interface FlashcardSet {
  id: string | null
  status: StudyStatus
  cards: Flashcard[]
  error: string | null
}

export interface QuizQuestion {
  question: string
  options: string[]
  answer_index: number
  explanation: string | null
}

export interface Quiz {
  id: string | null
  status: StudyStatus
  questions: QuizQuestion[]
  error: string | null
}

export const isStudyProcessing = (status: StudyStatus): boolean =>
  status === 'pending' || status === 'running'
