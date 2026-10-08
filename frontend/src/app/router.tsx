import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotFoundPage } from '@/features/misc/NotFoundPage'

/**
 * Route table. Routes are added here per level; heavy feature routes will be
 * lazy-loaded once real screens exist.
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
