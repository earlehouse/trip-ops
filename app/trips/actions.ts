'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Trip } from '@/lib/supabase/types'

export async function createTrip(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const office_location = formData.get('office_location') as string
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string
  const teams_raw = formData.get('teams') as string

  const { data, error } = await supabase
    .from('trips')
    .insert({ name, office_location, start_date, end_date })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const trip = data as Trip

  const teams: Array<{ name: string; headcount: number; color: string }> = JSON.parse(teams_raw || '[]')
  if (teams.length > 0) {
    await supabase.from('teams').insert(teams.map(t => ({ ...t, trip_id: trip.id })))
  }

  revalidatePath('/trips')
  return trip
}
