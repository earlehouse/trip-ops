import { createClient } from '@/lib/supabase/server'
import { SidebarServer } from '@/components/ui/SidebarServer'
import { notFound } from 'next/navigation'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('trips')
    .select('id, name, group_id')
    .eq('id', tripId)
    .single()
  const trip = data as { id: string; name: string; group_id: string | null } | null
  if (!trip) notFound()

  let group: { id: string; name: string; subTrips: Array<{ id: string; name: string }> } | undefined

  if (trip.group_id) {
    const [{ data: groupData }, { data: siblingsData }] = await Promise.all([
      supabase
        .from('trip_groups')
        .select('id, name')
        .eq('id', trip.group_id)
        .single(),
      supabase
        .from('trips')
        .select('id, name')
        .eq('group_id', trip.group_id)
        .order('name', { ascending: true }),
    ])

    if (groupData) {
      const g = groupData as { id: string; name: string }
      const subTrips = (siblingsData ?? []) as Array<{ id: string; name: string }>
      group = { id: g.id, name: g.name, subTrips }
    }
  }

  return (
    <div className="flex h-full min-h-screen">
      <SidebarServer tripId={trip.id} tripName={trip.name} group={group} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
