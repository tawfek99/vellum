import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { NotesPanel } from '@/features/notes/NotesPanel'
import { SearchPage } from '@/features/search/SearchPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

/**
 * Route table. `/login` is public; everything under `RequireAuth` needs a
 * session. The note editor is lazy-loaded so the heavy rich-text editor ships
 * in its own chunk, and opens as a focused full-page view.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/notes', element: <NotesPanel /> },
          {
            path: '/notes/:id',
            lazy: () =>
              import('@/features/notes/NoteEditorPage').then((module) => ({
                Component: module.NoteEditorPage,
              })),
          },
          { path: '/documents', element: <DocumentsPage /> },
          {
            path: '/documents/:id',
            lazy: () =>
              import('@/features/documents/DocumentViewPage').then((module) => ({
                Component: module.DocumentViewPage,
              })),
          },
          { path: '/search', element: <SearchPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
