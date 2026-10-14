import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

import {
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
  uploadDocument,
  type ListDocumentsParams,
  type UploadDocumentInput,
} from '@/features/documents/api'
import { isProcessing, type DocumentList, type DocumentUpdateInput } from '@/types/document'

export const documentsQueryKey = (params: ListDocumentsParams = {}): QueryKey => [
  'documents',
  params,
]

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: documentsQueryKey(params),
    queryFn: ({ signal }) => listDocuments({ ...params, signal }),
    // Poll only while something is still being processed.
    refetchInterval: (query) => {
      const data = query.state.data as DocumentList | undefined
      const processing = data?.items.some((item) => isProcessing(item.processing_status))
      return processing ? 2500 : false
    },
  })
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id as string),
    enabled: Boolean(id),
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, input }: { file: File; input?: UploadDocumentInput }) =>
      uploadDocument(file, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DocumentUpdateInput }) =>
      updateDocument(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
