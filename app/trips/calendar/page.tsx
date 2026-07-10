import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './CalendarClient'
import type { CalendarTripInput } from '@/lib/calendarLayout'

export default async function CalendarPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: tripsRaw } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date')
    .gte('end_date', today)
    .order('start_date', { ascending: true })

  const trips = (tripsRaw ?? []) as Array<{ id: string; name: string; start_date: string; end_date: string }>
  const tripIds = trips.map(t => t.id)

  const { data: guestsRaw } = tripIds.length
    ? await supabase.from('guests').select('trip_id').in('trip_id', tripIds)
    : { data: [] }

  const guestCounts: Record<string, number> = {}
  for (const g of (guestsRaw ?? []) as Array<{ trip_id: string }>) {
    guestCounts[g.trip_id] = (guestCounts[g.trip_id] ?? 0) + 1
  }

  const calendarTrips: CalendarTripInput[] = trips.map(t => ({
    id: t.id,
    name: t.name,
    start_date: t.start_date,
    end_date: t.end_date,
    guestCount: guestCounts[t.id] ?? 0,
  }))

  return <CalendarClient trips={calendarTrips} />
}
