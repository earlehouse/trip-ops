import { createClient } from '@/lib/supabase/server'
import { TripListClient } from './TripListClient'
import type { Trip, Team, TripGroup } from '@/lib/supabase/types'

export default async function TripsPage() {
  const supabase = await createClient()

  const { data: tripsRaw } = await supabase
    .from('trips')
    .select('*, teams(*)')
    .order('start_date', { ascending: true })

  const trips = (tripsRaw ?? []) as Array<Trip & { teams: Team[] }>
  const tripIds = trips.map(t => t.id)

  // Guest counts per trip
  const { data: guestsRaw } = tripIds.length
    ? await supabase.from('guests').select('trip_id').in('trip_id', tripIds)
    : { data: [] }
  const guests = (guestsRaw ?? []) as Array<{ trip_id: string }>
  const guestsByTrip: Record<string, number> = {}
  for (const g of guests) {
    guestsByTrip[g.trip_id] = (guestsByTrip[g.trip_id] ?? 0) + 1
  }

  // Unresolved bookings per trip (needed or in_progress events)
  const { data: eventsRaw } = tripIds.length
    ? await supabase
        .from('events')
        .select('trip_id, booking_status')
        .in('trip_id', tripIds)
        .in('booking_status', ['needed', 'in_progress'])
    : { data: [] }
  const unresolvedByTrip: Record<string, number> = {}
  for (const ev of (eventsRaw ?? []) as Array<{ trip_id: string }>) {
    unresolvedByTrip[ev.trip_id] = (unresolvedByTrip[ev.trip_id] ?? 0) + 1
  }

  const enrichedTrips = trips.map(t => ({
    ...t,
    guestCount: guestsByTrip[t.id] ?? 0,
    unresolvedBookings: unresolvedByTrip[t.id] ?? 0,
  }))

  // Fetch all groups
  const { data: groupsRaw } = await supabase
    .from('trip_groups')
    .select('id, name, start_date, end_date, notes, created_at')
    .order('start_date', { ascending: true })
  const groups = (groupsRaw ?? []) as TripGroup[]

  // Separate standalone trips (no group_id) from sub-trips
  const standaloneTrips = enrichedTrips.filter(t => !t.group_id)
  const subTripsByGroup: Record<string, typeof enrichedTrips> = {}
  for (const t of enrichedTrips) {
    if (t.group_id) {
      if (!subTripsByGroup[t.group_id]) subTripsByGroup[t.group_id] = []
      subTripsByGroup[t.group_id].push(t)
    }
  }

  return (
    <TripListClient
      standaloneTrips={standaloneTrips}
      groups={groups}
      subTripsByGroup={subTripsByGroup}
      allGroups={groups.map(g => ({ id: g.id, name: g.name }))}
    />
  )
}
