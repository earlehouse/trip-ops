import { createClient } from '@/lib/supabase/server'
import { SidebarServer } from '@/components/ui/SidebarServer'
import { notFound } from 'next/navigation'

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const supabase = await createClient()

  const [{ data: groupData }, { data: subTripsData }] = await Promise.all([
    supabase
      .from('trip_groups')
      .select('id, name')
      .eq('id', groupId)
      .single(),
    supabase
      .from('trips')
      .select('id, name')
      .eq('group_id', groupId)
      .order('name', { ascending: true }),
  ])

  const group = groupData as { id: string; name: string } | null
  if (!group) notFound()

  const subTrips = (subTripsData ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="flex h-full min-h-screen">
      <SidebarServer group={{ id: group.id, name: group.name, subTrips }} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
