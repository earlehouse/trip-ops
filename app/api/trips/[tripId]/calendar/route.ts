import { createClient } from '@/lib/supabase/server'
import { buildICS } from '@/lib/ics'
import type { NextRequest } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()

  const [{ data: tripRaw }, { data: eventsRaw }, { data: teamsRaw }] = await Promise.all([
    supabase.from('trips').select('id, name').eq('id', tripId).single(),
    supabase
      .from('events')
      .select('id, title, date, start_time, end_time, venue, notes')
      .eq('trip_id', tripId)
      .order('date')
      .order('start_time'),
    supabase.from('teams').select('id, name').eq('trip_id', tripId),
  ])

  if (!tripRaw) {
    return new Response('Trip not found', { status: 404 })
  }

  const trip = tripRaw as { id: string; name: string }
  const teams = (teamsRaw ?? []) as Array<{ id: string; name: string }>

  // Fetch team assignments for events
  const eventIds = ((eventsRaw ?? []) as Array<{ id: string }>).map(e => e.id)
  const { data: eventTeamsRaw } = eventIds.length
    ? await supabase.from('event_teams').select('event_id, team_id').in('event_id', eventIds)
    : { data: [] }
  const eventTeams = (eventTeamsRaw ?? []) as Array<{ event_id: string; team_id: string }>

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]))
  const teamsByEvent: Record<string, string[]> = {}
  for (const et of eventTeams) {
    if (!teamsByEvent[et.event_id]) teamsByEvent[et.event_id] = []
    teamsByEvent[et.event_id].push(teamMap[et.team_id] ?? '')
  }

  const events = ((eventsRaw ?? []) as Array<{
    id: string; title: string; date: string
    start_time: string | null; end_time: string | null
    venue: string | null; notes: string | null
  }>).map(ev => ({
    ...ev,
    teamNames: (teamsByEvent[ev.id] ?? []).filter(Boolean).join(', '),
  }))

  const ics = buildICS(trip.name, events)

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${trip.name}.ics"`,
      'Cache-Control': 'no-cache',
    },
  })
}
