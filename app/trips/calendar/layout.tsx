import { SidebarServer } from '@/components/ui/SidebarServer'

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <SidebarServer />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
