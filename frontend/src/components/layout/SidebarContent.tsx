import { BookOpen, Files, LayoutDashboard, NotebookText, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'

import { FolderTree } from '@/components/folders/FolderTree'
import { cn } from '@/lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/notes', label: 'Notes', icon: NotebookText },
  { to: '/documents', label: 'Documents', icon: Files },
]

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500',
    isActive
      ? 'bg-parchment-200 font-medium text-ink-900'
      : 'text-ink-700 hover:bg-parchment-100 hover:text-ink-900',
  )
}

/**
 * The navigation content shared by the desktop sidebar and the mobile drawer.
 * `onNavigate` lets the drawer close itself when a link is chosen.
 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <BookOpen className="size-5 text-clay-600" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold tracking-tight text-ink-900">
          Note Taker
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Primary">
        <div className="space-y-1">
          {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass} onClick={onNavigate}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>

        <FolderTree />
      </nav>

      <div className="border-t border-parchment-200 p-3">
        <NavLink to="/settings" className={navLinkClass} onClick={onNavigate}>
          <Settings className="size-4 shrink-0" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </div>
  )
}
