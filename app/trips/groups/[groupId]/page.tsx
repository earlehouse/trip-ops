import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { GroupWeekView } from '@/components/groups/GroupWeekView'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const supabase = await createClient()

  const { data: groupData } = await supabase
    .from('trip_groups')
    .select('id, name, start_date, end_date, notes')
    .eq('id', groupId)
    .single()

  const group = groupData as {
    id: string; name: string; start_date: string; end_date: string; notes: string | null
  } | null
  if (!group) notFound()

  const { data: subTripsData } = await supabase
    .from('trips')
    .select('id, name, start_date, end_date')
    .eq('group_id', groupId)
    .order('name', { ascending: true })

  const subTrips = (subTripsData ?? []) as Array<{
    id: string; name: string; start_date: string; end_date: string
  }>

  const subTripIds = subTrips.map(t => t.id)

  const [{ data: guestsData }, { data: eventsData }] = await Promise.all([
    subTripIds.length
      ? supabase
          .from('guests')
          .select('id, name, trip_id, hotel_confirmation, marriott_loyalty, hilton_loyalty')
          .in('trip_id', subTripIds)
      : { data: [] },
    subTripIds.length
      ? supabase
          .from('events')
          .select('id, trip_id, title, date, start_time, booking_status, is_shared')
          .in('trip_id', subTripIds)
          .order('date', { ascending: true })
      : { data: [] },
  ])

  const guests = (guestsData ?? []) as Array<{
    id: string; name: string; trip_id: string;
    hotel_confirmation: string | null; marriott_loyalty: string | null; hilton_loyalty: string | null
  }>

  const events = (eventsData ?? []) as Array<{
    id: string; trip_id: string; title: string; date: string;
    start_time: string | null; booking_status: string; is_shared: boolean
  }>

  return (
    <GroupWeekView
      group={group}
      subTrips={subTrips}
      guests={guests}
      events={events}
    />
  )
}
