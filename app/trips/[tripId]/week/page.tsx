import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WeekView } from '@/components/calendar/WeekView'
import type { Trip, Team } from '@/lib/supabase/types'

export default async function WeekPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()

  const [{ data: tripRaw }, { data: teamsRaw }, { data: evRows }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('teams').select('*').eq('trip_id', tripId),
    supabase
      .from('events')
      .select('*, event_teams(team_id)')
      .eq('trip_id', tripId)
      .order('date')
      .order('start_time'),
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
    is_fuzzy_time: ev.is_fuzzy_time as boolean,
    applies_to_all_teams: ev.applies_to_all_teams as boolean,
    booking_status: ev.booking_status as string,
    venue: ev.venue as string | null,
    headcount: ev.headcount as number | null,
    notes: ev.notes as string | null,
    created_at: ev.created_at as string,
    teamIds: (ev.event_teams as Array<{ team_id: string }>).map(et => et.team_id),
  }))

  return <WeekView trip={trip} teams={teams} initialEvents={events} />
}
