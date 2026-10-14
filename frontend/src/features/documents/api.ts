import { apiFetch } from '@/lib/api/client'
import type { Document, DocumentList, DocumentUpdateInput } from '@/types/document'

export interface ListDocumentsParams {
  folderId?: string | null
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export function listDocuments(params: ListDocumentsParams = {}): Promise<DocumentList> {
  const query = new URLSearchParams()
  if (params.folderId) query.set('folder_id', params.folderId)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const queryString = query.toString()
  return apiFetch<DocumentList>(`/documents${queryString ? `?${queryString}` : ''}`, {
    signal: params.signal,
  })
}

export function getDocument(id: string): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`)
}

export interface UploadDocumentInput {
  title?: string
  folderId?: string | null
}

export function uploadDocument(file: File, input: UploadDocumentInput = {}): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  if (input.title) form.append('title', input.title)
  if (input.folderId) form.append('folder_id', input.folderId)
  return apiFetch<Document>('/documents', { method: 'POST', form })
}

export function updateDocument(id: string, input: DocumentUpdateInput): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`, { method: 'PATCH', body: input })
}

export function deleteDocument(id: string): Promise<void> {
  return apiFetch<void>(`/documents/${id}`, { method: 'DELETE' })
}
