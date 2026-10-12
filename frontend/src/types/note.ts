/** Shared note types (mirror the backend `NoteRead` schema). */

export interface Note {
  id: string
  folder_id: string | null
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface NoteCreateInput {
  title?: string
  content?: string
  folder_id?: string | null
  is_pinned?: boolean
}

export interface NoteUpdateInput {
  title?: string
  content?: string
  folder_id?: string | null
  is_pinned?: boolean
}

export interface NoteList {
  items: Note[]
  total: number
  page: number
  page_size: number
}
