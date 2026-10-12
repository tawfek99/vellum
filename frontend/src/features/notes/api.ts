import { apiFetch } from '@/lib/api/client'
import type { Note, NoteCreateInput, NoteList, NoteUpdateInput } from '@/types/note'

export interface ListNotesParams {
  folderId?: string | null
  search?: string
  page?: number
  pageSize?: number
  signal?: AbortSignal
}

export function listNotes(params: ListNotesParams = {}): Promise<NoteList> {
  const query = new URLSearchParams()
  if (params.folderId) query.set('folder_id', params.folderId)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  const queryString = query.toString()
  return apiFetch<NoteList>(`/notes${queryString ? `?${queryString}` : ''}`, {
    signal: params.signal,
  })
}

export function getNote(id: string): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`)
}

export function createNote(input: NoteCreateInput = {}): Promise<Note> {
  return apiFetch<Note>('/notes', { method: 'POST', body: input })
}

export function updateNote(id: string, input: NoteUpdateInput): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`, { method: 'PATCH', body: input })
}

export function deleteNote(id: string): Promise<void> {
  return apiFetch<void>(`/notes/${id}`, { method: 'DELETE' })
}
