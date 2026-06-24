import { createClient } from '@/lib/supabase/server'
import { MasterOverview } from '@/components/overview/MasterOverview'

const MEAL_KEYWORDS = ['breakfast', 'lunch', 'dinner', 'happy hour', 'catering', 'brunch', 'food']
const isMeal = (title: string) => MEAL_KEYWORDS.some(k => title.toLowerCase().includes(k))

export default async function MasterOverviewPage() {
  const supabase = await createClient()

  const [{ data: trips }, { data: groups }] = await Promise.all([
    supabase
      .from('trips')
      .select('id, name, start_date, end_date, notes, group_id')
      .order('start_date', { ascending: true }),
    supabase
      .from('trip_groups')
      .select('id, name, start_date, end_date, notes')
      .order('start_date', { ascending: true }),
  ])

  const tripIds = (trips ?? []).map(t => t.id)
  if (tripIds.length === 0) return <MasterOverview standaloneRows={[]} groups={[]} rowsByGroup={{}} />

  const [{ data: guests }, { data: events }] = await Promise.all([
    supabase
      .from('guests')
      .select('trip_id, name, hotel_confirmation')
      .in('trip_id', tripIds),
    supabase
      .from('events')
      .select('trip_id, id, title, date, start_time, booking_status')
      .in('trip_id', tripIds)
      .order('date')
      .order('start_time'),
  ])

  const rows = (trips ?? []).map(trip => {
    const tripGuests = (guests ?? []).filter(g => g.trip_id === trip.id)
    const tripEvents = (events ?? []).filter(e => e.trip_id === trip.id)

    const confirmed = tripGuests.filter(g => g.hotel_confirmation?.trim())
    const missing = tripGuests.filter(g => !g.hotel_confirmation?.trim())

    const foodNeeded = tripEvents.filter(e => e.booking_status === 'needed' && isMeal(e.title))
    const foodInProgress = tripEvents.filter(e => e.booking_status === 'in_progress' && isMeal(e.title))
    const foodTotal = tripEvents.filter(e => isMeal(e.title)).length
    const agendaNeeded = tripEvents.filter(e => e.booking_status === 'needed' && !isMeal(e.title))
    const agendaInProgress = tripEvents.filter(e => e.booking_status === 'in_progress' && !isMeal(e.title))
    const agendaTotal = tripEvents.filter(e => !isMeal(e.title)).length

    return {
      trip,
      totalGuests: tripGuests.length,
      confirmedCount: confirmed.length,
      missingGuests: missing.map(g => g.name),
      foodNeeded,
      foodInProgress,
      foodTotal,
      agendaNeeded,
      agendaInProgress,
      agendaTotal,
    }
  })

  const standaloneRows = rows.filter(r => !r.trip.group_id)
  const rowsByGroup: Record<string, typeof rows> = {}
  for (const row of rows) {
    if (row.trip.group_id) {
      if (!rowsByGroup[row.trip.group_id]) rowsByGroup[row.trip.group_id] = []
      rowsByGroup[row.trip.group_id].push(row)
    }
  }

  return (
    <MasterOverview
      standaloneRows={standaloneRows}
      groups={groups ?? []}
      rowsByGroup={rowsByGroup}
    />
  )
}
