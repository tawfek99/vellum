/** Shared folder types (mirror the backend `FolderRead` schema). */

export interface Folder {
  id: string
  name: string
  parent_id: string | null
  note_count: number
  created_at: string
  updated_at: string
}

export interface FolderCreateInput {
  name: string
  parent_id?: string | null
}

export interface FolderUpdateInput {
  name?: string
  parent_id?: string | null
}
