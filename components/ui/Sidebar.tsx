'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, BookOpen, Home, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  tripId?: string
  tripName?: string
}

export function Sidebar({ tripId, tripName }: SidebarProps) {
  const pathname = usePathname()

  const tripNav = tripId ? [
    { href: `/trips/${tripId}/week`, label: 'Calendar', icon: CalendarDays },
    { href: `/trips/${tripId}/roster`, label: 'Roster', icon: Users },
    { href: `/trips/${tripId}/bookings`, label: 'Bookings', icon: BookOpen },
  ] : []

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-gray-100">
        <Link href="/trips" className="flex items-center gap-2 text-gray-900 hover:text-indigo-600 transition-colors">
          <Map size={18} className="text-indigo-500" />
          <span className="font-semibold text-sm">Trip Ops</span>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <NavItem href="/trips" label="All Trips" icon={Home} active={pathname === '/trips'} />

        {tripId && (
          <>
            <div className="pt-3 pb-1 px-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                {tripName ?? 'Current Trip'}
              </p>
            </div>
            {tripNav.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
              />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

function NavItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <Icon size={16} className={active ? 'text-indigo-500' : 'text-gray-400'} />
      {label}
    </Link>
  )
}
