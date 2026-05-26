'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Event } from '@/lib/supabase/types'

export async function updateEvent(id: string, fields: Record<string, unknown>, tripId?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('events').update(fields as Record<string, unknown>).eq('id', id)
  if (error) throw new Error(error.message)
  if (tripId) revalidatePath(`/trips/${tripId}/week`)
}

export async function createEvent(tripId: string, fields: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .insert({ trip_id: tripId, ...fields } as Record<string, unknown>)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/trips/${tripId}/week`)
  return data as Event
}

export async function deleteEvent(tripId: string, eventId: string) {
  const supabase = await createClient()
  await supabase.from('events').delete().eq('id', eventId)
  revalidatePath(`/trips/${tripId}/week`)
}

export async function setEventTeams(eventId: string, teamIds: string[]) {
  const supabase = await createClient()
  await supabase.from('event_teams').delete().eq('event_id', eventId)
  if (teamIds.length > 0) {
    const rows = teamIds.map(tid => ({ event_id: eventId, team_id: tid })) as Record<string, unknown>[]
    await supabase.from('event_teams').insert(rows)
  }
}

export async function createEventWithTeams(
  tripId: string,
  fields: Record<string, unknown>,
  teamIds: string[],
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .insert({ trip_id: tripId, ...fields } as Record<string, unknown>)
    .select()
    .single()
  if (error) throw new Error(error.message)
  const ev = data as Event
  if (teamIds.length > 0) {
    const rows = teamIds.map(tid => ({ event_id: ev.id, team_id: tid })) as Record<string, unknown>[]
    await supabase.from('event_teams').insert(rows)
  }
  return ev
}
