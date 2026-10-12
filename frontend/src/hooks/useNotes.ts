import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
  type ListNotesParams,
} from '@/features/notes/api'
import type { NoteUpdateInput } from '@/types/note'

export const notesQueryKey = (params: ListNotesParams = {}): QueryKey => ['notes', params]

/** All note-list queries share the `['notes']` prefix so one invalidate refreshes them. */
export function useNotes(params: ListNotesParams = {}) {
  return useQuery({
    queryKey: notesQueryKey(params),
    queryFn: ({ signal }) => listNotes({ ...params, signal }),
  })
}

export function useNote(id: string | undefined) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => getNote(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoteUpdateInput }) => updateNote(id, input),
    onSuccess: (note) => {
      queryClient.setQueryData(['note', note.id], note)
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useMoveNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      updateNote(id, { folder_id: folderId }),
    onSuccess: (note) => {
      queryClient.setQueryData(['note', note.id], note)
      void queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
