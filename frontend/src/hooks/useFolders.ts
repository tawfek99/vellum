import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'

import { createFolder, deleteFolder, listFolders, updateFolder } from '@/features/folders/api'
import type { Folder, FolderCreateInput } from '@/types/folder'

export const foldersQueryKey: QueryKey = ['folders']

export function useFolders() {
  return useQuery({
    queryKey: foldersQueryKey,
    queryFn: ({ signal }) => listFolders(signal),
  })
}

/** Roll back the list to a snapshot taken before an optimistic change. */
function useOptimistic<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  apply: (folders: Folder[], variables: TVariables) => Folder[],
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: foldersQueryKey })
      const previous = queryClient.getQueryData<Folder[]>(foldersQueryKey)
      queryClient.setQueryData<Folder[]>(foldersQueryKey, (old = []) => apply(old, variables))
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(foldersQueryKey, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: foldersQueryKey })
    },
  })
}

export function useCreateFolder() {
  return useOptimistic<FolderCreateInput>(createFolder, (folders, input) => [
    ...folders,
    {
      id: `temp-${crypto.randomUUID()}`,
      name: input.name,
      parent_id: input.parent_id ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ])
}

export function useRenameFolder() {
  return useOptimistic<{ id: string; name: string }>(
    ({ id, name }) => updateFolder(id, { name }),
    (folders, { id, name }) => folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
  )
}

export function useMoveFolder() {
  return useOptimistic<{ id: string; parentId: string | null }>(
    ({ id, parentId }) => updateFolder(id, { parent_id: parentId }),
    (folders, { id, parentId }) =>
      folders.map((folder) => (folder.id === id ? { ...folder, parent_id: parentId } : folder)),
  )
}

export function useDeleteFolder() {
  return useOptimistic<string>(
    (id) => deleteFolder(id),
    (folders, id) => folders.filter((folder) => folder.id !== id),
  )
}
