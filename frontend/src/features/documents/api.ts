import { apiFetch } from '@/lib/api/client'
import type { Document, DocumentContent, DocumentList, DocumentUpdateInput } from '@/types/document'
import type { QaExchange, QaHistory } from '@/types/qa'
import type { Summary } from '@/types/summary'

export interface ListDocumentsParams {
  folderId?: string | null
  page?: number
  pageSize?: number
  signal?: AbortSignal
  enabled?: boolean
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

export function getDocumentContent(id: string): Promise<DocumentContent> {
  return apiFetch<DocumentContent>(`/documents/${id}/content`)
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

export function getSummary(id: string): Promise<Summary> {
  return apiFetch<Summary>(`/documents/${id}/summary`)
}

export function createSummary(id: string): Promise<Summary> {
  return apiFetch<Summary>(`/documents/${id}/summary`, { method: 'POST' })
}

export function getQa(id: string): Promise<QaHistory> {
  return apiFetch<QaHistory>(`/documents/${id}/qa`)
}

export function askQuestion(id: string, question: string): Promise<QaExchange> {
  return apiFetch<QaExchange>(`/documents/${id}/ask`, {
    method: 'POST',
    body: { question },
  })
}
