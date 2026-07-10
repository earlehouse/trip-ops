import { createClient } from '@/lib/supabase/server'
import { Sidebar, type NavListItem } from './Sidebar'

interface Props {
  tripId?: string
  tripName?: string
  group?: {
    id: string
    name: string
    subTrips: Array<{ id: string; name: string }>
  }
}

export async function SidebarServer({ tripId, tripName, group }: Props) {
  const supabase = await createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [{ data: tripsData }, { data: groupsData }] = await Promise.all([
    supabase.from('trips').select('id, name, group_id, start_date, end_date').order('start_date', { ascending: true }),
    supabase.from('trip_groups').select('id, name, start_date, end_date').order('start_date', { ascending: true }),
  ])

  const trips = (tripsData ?? []) as Array<{ id: string; name: string; group_id: string | null; start_date: string; end_date: string }>
  const groups = (groupsData ?? []) as Array<{ id: string; name: string; start_date: string; end_date: string }>

  // Only show upcoming/active trips in the sidebar
  const activeGroups = groups.filter(g => g.end_date >= today)

  const groupMap: Record<string, { id: string; name: string; start_date: string; trips: Array<{ id: string; name: string }> }> = {}
  for (const g of activeGroups) groupMap[g.id] = { id: g.id, name: g.name, start_date: g.start_date, trips: [] }
  const standaloneItems: Array<{ id: string; name: string; start_date: string }> = []

  for (const t of trips) {
    if (t.end_date < today) continue  // skip past standalone trips
    if (t.group_id && groupMap[t.group_id]) {
      groupMap[t.group_id].trips.push({ id: t.id, name: t.name })
    } else if (!t.group_id) {
      standaloneItems.push({ id: t.id, name: t.name, start_date: t.start_date })
    }
    // trips in a past group are already excluded since the group isn't in groupMap
  }

  // Groups and standalone trips interleaved by start date, not grouped-first
  const navItems: NavListItem[] = [
    ...Object.values(groupMap)
      .filter(g => g.trips.length > 0)
      .map(g => ({ kind: 'group' as const, ...g })),
    ...standaloneItems.map(t => ({ kind: 'trip' as const, ...t })),
  ].sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <Sidebar
      tripId={tripId}
      tripName={tripName}
      group={group}
      navItems={navItems}
    />
  )
}
