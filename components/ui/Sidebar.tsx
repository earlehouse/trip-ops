'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, BookOpen, Home, Map, LayoutDashboard, TableProperties, Users2, Layers, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'

interface SidebarProps {
  tripId?: string
  tripName?: string
  group?: {
    id: string
    name: string
    subTrips: Array<{ id: string; name: string }>
  }
}

export function Sidebar({ tripId, tripName, group }: SidebarProps) {
  const pathname = usePathname()

  const tripNav = tripId ? [
    { href: `/trips/${tripId}/overview`, label: 'Overview', icon: LayoutDashboard },
    { href: `/trips/${tripId}/week`, label: 'Calendar', icon: CalendarDays },
    { href: `/trips/${tripId}/roster`, label: 'Roster', icon: Users },
    { href: `/trips/${tripId}/bookings`, label: 'Agenda', icon: BookOpen },
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
        <NavItem href="/trips/overview" label="Master Plan" icon={TableProperties} active={pathname === '/trips/overview'} />
        <NavItem href="/trips/travelers" label="Travelers" icon={Users2} active={pathname === '/trips/travelers'} />

        {/* Group section: shown when viewing a group or a sub-trip within a group */}
        {group && (
          <>
            <div className="pt-3 pb-1 px-2">
              <Link
                href={`/trips/groups/${group.id}`}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-indigo-600 transition-colors"
              >
                <Layers size={12} />
                <span className="truncate">{group.name}</span>
              </Link>
            </div>
            {group.subTrips.map(sub => {
              const isActive = tripId === sub.id
              return (
                <div key={sub.id}>
                  <Link
                    href={`/trips/${sub.id}/overview`}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 ml-0.5" />
                    <span className="truncate">{sub.name}</span>
                  </Link>
                  {/* Per-sub-trip nav shown when this sub-trip is active */}
                  {isActive && tripNav.map(item => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={pathname.startsWith(item.href)}
                      indent
                    />
                  ))}
                </div>
              )
            })}
          </>
        )}

        {/* Standalone trip section: shown when tripId is set but no group */}
        {tripId && !group && (
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

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-gray-100">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}

function NavItem({ href, label, icon: Icon, active, indent }: {
  href: string; label: string; icon: React.ElementType; active: boolean; indent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        indent && 'pl-6',
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
