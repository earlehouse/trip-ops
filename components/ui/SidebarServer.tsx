import { createClient } from '@/lib/supabase/server'
import { Sidebar } from './Sidebar'

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
    supabase.from('trips').select('id, name, group_id, end_date').order('start_date', { ascending: true }),
    supabase.from('trip_groups').select('id, name, end_date').order('start_date', { ascending: true }),
  ])

  const trips = (tripsData ?? []) as Array<{ id: string; name: string; group_id: string | null; end_date: string }>
  const groups = (groupsData ?? []) as Array<{ id: string; name: string; end_date: string }>

  // Only show upcoming/active trips in the sidebar
  const activeGroups = groups.filter(g => g.end_date >= today)

  const groupMap: Record<string, { id: string; name: string; trips: Array<{ id: string; name: string }> }> = {}
  for (const g of activeGroups) groupMap[g.id] = { id: g.id, name: g.name, trips: [] }
  const standalone: Array<{ id: string; name: string }> = []

  for (const t of trips) {
    if (t.end_date < today) continue  // skip past standalone trips
    if (t.group_id && groupMap[t.group_id]) {
      groupMap[t.group_id].trips.push({ id: t.id, name: t.name })
    } else if (!t.group_id) {
      standalone.push({ id: t.id, name: t.name })
    }
    // trips in a past group are already excluded since the group isn't in groupMap
  }

  const allTrips = {
    groups: Object.values(groupMap).filter(g => g.trips.length > 0),
    standalone,
  }

  return (
    <Sidebar
      tripId={tripId}
      tripName={tripName}
      group={group}
      allTrips={allTrips}
    />
  )
}
