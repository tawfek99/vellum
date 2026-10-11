import { apiFetch } from '@/lib/api/client'
import type { Folder, FolderCreateInput, FolderUpdateInput } from '@/types/folder'

export function listFolders(signal?: AbortSignal): Promise<Folder[]> {
  return apiFetch<Folder[]>('/folders', { signal })
}

export function createFolder(input: FolderCreateInput): Promise<Folder> {
  return apiFetch<Folder>('/folders', { method: 'POST', body: input })
}

export function updateFolder(id: string, input: FolderUpdateInput): Promise<Folder> {
  return apiFetch<Folder>(`/folders/${id}`, { method: 'PATCH', body: input })
}

export function deleteFolder(id: string): Promise<void> {
  return apiFetch<void>(`/folders/${id}`, { method: 'DELETE' })
}
