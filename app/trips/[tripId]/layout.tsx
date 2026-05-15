import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'
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
  const { data } = await supabase.from('trips').select('id, name').eq('id', tripId).single()
  const trip = data as { id: string; name: string } | null
  if (!trip) notFound()

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar tripId={trip.id} tripName={trip.name} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
