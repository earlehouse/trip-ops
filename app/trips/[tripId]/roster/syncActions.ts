'use server'
import { createClient } from '@/lib/supabase/server'
import { parseCanvasText } from '@/lib/parseCanvas'

export type SyncResult = {
  updated: string[]
  created: string[]
  skipped: string[]
  error?: string
}

export async function syncGuestsFromCanvasText(
  tripId: string,
  tripStartDate: string,
  canvasText: string,
): Promise<SyncResult> {
  if (!canvasText.trim()) {
    return { updated: [], created: [], skipped: [], error: 'No content provided' }
  }

  const tripYear = new Date(tripStartDate).getFullYear()
  const parsed = parseCanvasText(canvasText, tripYear)

  if (parsed.length === 0) {
    return {
      updated: [], created: [], skipped: [],
      error: "No guests found. Make sure your canvas has a header row with \"Name\" and you've copied the full table.",
    }
  }

  const supabase = await createClient()
  const updated: string[] = []
  const created: string[] = []
  const skipped: string[] = []

  for (const guest of parsed) {
    const fields = {
      phone_number: guest.phone_number,
      arrival_date: guest.arrival_date,
      arrival_time: guest.arrival_time,
      departure_date: guest.departure_date,
      departure_time: guest.departure_time,
      hotel_confirmation: guest.hotel_confirmation,
      bonvoy_number: guest.bonvoy_number,
    }

    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('trip_id', tripId)
      .ilike('name', guest.name)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('guests')
        .update(fields as Record<string, unknown>)
        .eq('id', (existing as { id: string }).id)
      error ? skipped.push(guest.name) : updated.push(guest.name)
    } else {
      const { error } = await supabase
        .from('guests')
        .insert({ trip_id: tripId, name: guest.name, ...fields } as Record<string, unknown>)
      error ? skipped.push(guest.name) : created.push(guest.name)
    }
  }

  return { updated, created, skipped }
}
