import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { GuestTable } from '@/components/roster/GuestTable'
import type { Trip, Team } from '@/lib/supabase/types'

export default async function RosterPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()

  const [{ data: tripRaw }, { data: guestsRaw }, { data: teamsRaw }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase
      .from('guests')
      .select('id, trip_id, team_id, name, phone_number, arrival_date, arrival_time, departure_date, departure_time, hotel_confirmation, marriott_loyalty, hilton_loyalty, notes, team:teams(id, trip_id, name, headcount, color)')
      .eq('trip_id', tripId)
      .order('arrival_date')
      .order('arrival_time'),
    supabase.from('teams').select('*').eq('trip_id', tripId),
  ])

  const trip = tripRaw as Trip | null
  const teams = (teamsRaw ?? []) as Team[]
  if (!trip) notFound()

  return (
    <GuestTable
      tripId={tripId}
      trip={trip}
      initialGuests={(guestsRaw ?? []) as unknown as Parameters<typeof GuestTable>[0]['initialGuests']}
      teams={teams}
    />
  )
}
