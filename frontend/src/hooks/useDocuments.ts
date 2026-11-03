import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

import {
  askQuestion,
  createSummary,
  deleteDocument,
  getDocument,
  getDocumentContent,
  getQa,
  getSummary,
  listDocuments,
  updateDocument,
  uploadDocument,
  type ListDocumentsParams,
  type UploadDocumentInput,
} from '@/features/documents/api'
import { isProcessing, type DocumentList, type DocumentUpdateInput } from '@/types/document'
import { isQaProcessing, type QaHistory } from '@/types/qa'
import { isSummaryProcessing, type Summary } from '@/types/summary'

export const documentsQueryKey = (params: ListDocumentsParams = {}): QueryKey => [
  'documents',
  params,
]

export function useDocuments({ enabled = true, ...params }: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: documentsQueryKey(params),
    queryFn: ({ signal }) => listDocuments({ ...params, signal }),
    enabled,
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

export function useDocumentContent(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['document-content', id],
    queryFn: () => getDocumentContent(id as string),
    enabled: Boolean(id) && enabled,
    // Signed URLs are valid for ~1 hour; refresh comfortably before that.
    staleTime: 50 * 60 * 1000,
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

/**
 * Move a document into a folder (or unfile it with `folderId: null`).
 * Updates every cached documents list optimistically so the folder pill
 * changes immediately; rolls back if the request fails.
 */
export function useMoveDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string | null }) =>
      updateDocument(id, { folder_id: folderId }),
    onMutate: async ({ id, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ['documents'] })
      const snapshots = queryClient.getQueriesData<DocumentList>({ queryKey: ['documents'] })

      for (const [key, data] of snapshots) {
        if (!data) continue
        queryClient.setQueryData<DocumentList>(key, {
          ...data,
          items: data.items.map((item) =>
            item.id === id ? { ...item, folder_id: folderId } : item,
          ),
        })
      }
      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] })
      void queryClient.invalidateQueries({ queryKey: ['document'] })
    },
  })
}

export function useSummary(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['document-summary', id],
    queryFn: () => getSummary(id as string),
    enabled: Boolean(id) && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as Summary | undefined
      return data && isSummaryProcessing(data.status) ? 2000 : false
    },
  })
}

export function useCreateSummary() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => createSummary(documentId),
    onSuccess: (summary, documentId) => {
      queryClient.setQueryData(['document-summary', documentId], summary)
    },
  })
}

export function useQa(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['document-qa', id],
    queryFn: () => getQa(id as string),
    enabled: Boolean(id) && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as QaHistory | undefined
      const processing = data?.items.some((item) => isQaProcessing(item.status))
      return processing ? 2000 : false
    },
  })
}

export function useAskQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, question }: { id: string; question: string }) =>
      askQuestion(id, question),
    onSuccess: (_exchange, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['document-qa', id] })
    },
  })
}
