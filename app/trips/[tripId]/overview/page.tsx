import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TripOverview } from '@/components/overview/TripOverview'

export default async function OverviewPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params
  const supabase = await createClient()

  const [{ data: tripRaw }, { data: guests }, { data: evRows }, { data: prepRows }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('guests').select('id, name, hotel_confirmation').eq('trip_id', tripId),
    supabase
      .from('events')
      .select('id, title, date, start_time, booking_status')
      .eq('trip_id', tripId)
      .order('date')
      .order('start_time'),
    supabase
      .from('trip_prep_tasks')
      .select('task_key, completed, completed_at')
      .eq('trip_id', tripId),
  ])

  if (!tripRaw) notFound()

  return (
    <TripOverview
      trip={tripRaw as Record<string, unknown>}
      guests={(guests ?? []) as Array<{ id: string; name: string; hotel_confirmation: string | null }>}
      events={(evRows ?? []) as Array<{ id: string; title: string; date: string; start_time: string | null; booking_status: string }>}
      prepTasks={(prepRows ?? []) as Array<{ task_key: string; completed: boolean; completed_at: string | null }>}
    />
  )
}
