import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import { isValidServiceKey } from '@/lib/apiAuth'
import type { NextRequest } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

// Creates a new trip from a request pushed in by office-scheduler.
// Only ever creates — never updates or matches against existing trips.
export async function POST(req: NextRequest) {
  if (!isValidServiceKey(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS })
  }

  const name = body.name
  const start_date = body.start_date
  const end_date = body.end_date

  if (typeof name !== 'string' || !name.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400, headers: CORS })
  }
  if (typeof start_date !== 'string' || typeof end_date !== 'string') {
    return Response.json({ error: 'start_date and end_date are required (YYYY-MM-DD)' }, { status: 400, headers: CORS })
  }

  const estimated_attendees = body.estimated_attendees
  if (estimated_attendees !== undefined && estimated_attendees !== null && typeof estimated_attendees !== 'number') {
    return Response.json({ error: 'estimated_attendees must be a number' }, { status: 400, headers: CORS })
  }

  const room_requested = typeof body.room_requested === 'string' ? body.room_requested : null
  const purpose = typeof body.purpose === 'string' ? body.purpose : null
  const notes = typeof body.notes === 'string' ? body.notes : null

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: name.trim(),
      start_date,
      end_date,
      room_requested,
      purpose,
      notes,
      estimated_attendees: estimated_attendees ?? null,
    })
    .select('id, name, start_date, end_date, room_requested, purpose, estimated_attendees, notes')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return Response.json(data, { status: 201, headers: CORS })
}
