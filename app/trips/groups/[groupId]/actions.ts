'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGroupNotes(groupId: string, notes: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trip_groups')
    .update({ notes })
    .eq('id', groupId)
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/groups/${groupId}`)
  revalidatePath('/trips/overview')
}

export async function createGroup(data: { name: string; start_date: string; end_date: string }) {
  const supabase = await createClient()
  const { data: group, error } = await supabase
    .from('trip_groups')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
  return group as { id: string; name: string; start_date: string; end_date: string; notes: string | null; created_at: string }
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  await supabase.from('trips').update({ group_id: null }).eq('group_id', groupId)
  const { error } = await supabase.from('trip_groups').delete().eq('id', groupId)
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
}

export async function assignTripToGroup(tripId: string, groupId: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trips')
    .update({ group_id: groupId })
    .eq('id', tripId)
  if (error) throw new Error(error.message)
  revalidatePath('/trips')
  if (groupId) revalidatePath(`/trips/groups/${groupId}`)
}
