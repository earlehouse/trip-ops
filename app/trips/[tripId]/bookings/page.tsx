import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingTracker } from '@/components/bookings/BookingTracker'
import type { Trip, Team } from '@/lib/supabase/types'

export default async function BookingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()

  const [{ data: tripRaw }, { data: evRows }, { data: teamsRaw }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase
      .from('events')
      .select('*, event_teams(team_id)')
      .eq('trip_id', tripId)
      .order('date')
      .order('start_time'),
    supabase.from('teams').select('*').eq('trip_id', tripId),
  ])

  const trip = tripRaw as Trip | null
  const teams = (teamsRaw ?? []) as Team[]
  if (!trip) notFound()

  const events = ((evRows ?? []) as Array<Record<string, unknown>>).map(ev => ({
    id: ev.id as string,
    trip_id: ev.trip_id as string,
    title: ev.title as string,
    date: ev.date as string,
    start_time: ev.start_time as string | null,
    end_time: ev.end_time as string | null,
    booking_status: ev.booking_status as string,
    venue: ev.venue as string | null,
    headcount: ev.headcount as number | null,
    notes: ev.notes as string | null,
    teamIds: (ev.event_teams as Array<{ team_id: string }>).map(et => et.team_id),
  }))

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const calendarUrl = `webcal://${host}/api/trips/${tripId}/calendar`
  const calendarHttpUrl = `${protocol}://${host}/api/trips/${tripId}/calendar`

  return (
    <BookingTracker
      tripId={tripId}
      initialEvents={events}
      teams={teams}
      calendarUrl={calendarUrl}
      calendarHttpUrl={calendarHttpUrl}
    />
  )
}
