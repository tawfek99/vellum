import { SidebarContent } from '@/components/layout/SidebarContent'

/** Desktop-only static sidebar (the mobile version is a drawer). */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-parchment-200 bg-parchment-50 lg:block">
      <SidebarContent />
    </aside>
  )
}
