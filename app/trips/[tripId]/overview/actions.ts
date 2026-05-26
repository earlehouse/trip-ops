'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function togglePrepTask(tripId: string, taskKey: string, completed: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trip_prep_tasks')
    .upsert(
      { trip_id: tripId, task_key: taskKey, completed, completed_at: completed ? new Date().toISOString() : null },
      { onConflict: 'trip_id,task_key' }
    )
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/overview`)
}

export async function updateTripNotes(tripId: string, notes: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('trips')
    .update({ notes } as Record<string, unknown>)
    .eq('id', tripId)
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/overview`)
}
