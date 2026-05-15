'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Guest } from '@/lib/supabase/types'

export async function updateGuest(id: string, field: string, value: string | null) {
  const supabase = await createClient()
  const { error } = await supabase.from('guests').update({ [field]: value } as Record<string, unknown>).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function addGuest(tripId: string, teamId: string | null) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('guests')
    .insert({ trip_id: tripId, team_id: teamId, name: 'New guest' } as Record<string, unknown>)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/roster`)
  return data as Guest
}

export async function deleteGuest(tripId: string, guestId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('guests').delete().eq('id', guestId)
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/roster`)
}
