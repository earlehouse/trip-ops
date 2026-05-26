import { createClient } from '@/lib/supabase/server'
import { TravelersDirectory } from '@/components/travelers/TravelersDirectory'
import type { Traveler } from '@/components/travelers/TravelersDirectory'

export default async function TravelersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('travelers')
    .select('id, name, marriott_loyalty, hilton_loyalty')
    .order('name')

  if (error) throw new Error(error.message)

  const travelers: Traveler[] = (data ?? []).map(row => ({
    id: row.id as string,
    name: row.name as string,
    marriott_loyalty: (row.marriott_loyalty as string | null) ?? null,
    hilton_loyalty: (row.hilton_loyalty as string | null) ?? null,
  }))

  return <TravelersDirectory travelers={travelers} />
}
