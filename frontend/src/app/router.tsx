import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { NoteEditorPage } from '@/features/notes/NoteEditorPage'
import { NotesPage } from '@/features/notes/NotesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

/**
 * Route table. `/login` is public; everything under `RequireAuth` needs a
 * session. Heavy routes will be lazy-loaded once real screens exist.
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
          { path: '/notes', element: <NotesPage /> },
          { path: '/notes/:id', element: <NoteEditorPage /> },
          { path: '/documents', element: <DocumentsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
