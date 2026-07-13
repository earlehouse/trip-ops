import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  const supabase = await createClient()

  let query = supabase
    .from('trips')
    .select(`
      id, name, office_location, start_date, end_date,
      notes, slack_canvas_url, group_id, created_at,
      teams ( id, name, headcount, color )
    `)
    .order('start_date')

  if (start) query = query.gte('end_date', start)
  if (end)   query = query.lte('start_date', end)

  const { data, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return Response.json(data, {
    headers: { ...CORS, 'Cache-Control': 'public, max-age=60' },
  })
}
