/** Shared document types (mirror the backend `DocumentRead` schema). */

export type DocumentStatus =
  | 'uploaded'
  | 'extracting'
  | 'needs_ocr'
  | 'ready'
  | 'failed'

export interface Document {
  id: string
  folder_id: string | null
  title: string
  file_name: string
  mime_type: string
  file_size_bytes: number
  page_count: number
  processing_status: DocumentStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface DocumentList {
  items: Document[]
  total: number
  page: number
  page_size: number
}

export interface DocumentUpdateInput {
  title?: string
  folder_id?: string | null
}

export const isProcessing = (status: DocumentStatus): boolean =>
  status === 'uploaded' || status === 'extracting'
