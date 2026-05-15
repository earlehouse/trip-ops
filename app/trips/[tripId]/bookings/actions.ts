'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateEventStatus(tripId: string, eventId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('events')
    .update({ booking_status: status } as Record<string, unknown>)
    .eq('id', eventId)
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/bookings`)
}
