import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Verify the request actually came from Slack
function verifySlackSignature(req: NextRequest, rawBody: string): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) return false

  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const slackSig = req.headers.get('x-slack-signature') ?? ''

  // Reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false

  const base = `v0:${timestamp}:${rawBody}`
  const expected = 'v0=' + crypto.createHmac('sha256', signingSecret).update(base).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(slackSig))
}

// Extract canvas ID from a Slack canvas URL
// URLs look like: https://app.slack.com/canvas/F012345/C012345
function extractCanvasId(url: string): string | null {
  const match = url.match(/\/canvas\/([A-Z0-9]+)/i)
  return match ? match[1] : null
}

// Fetch canvas content from Slack API
async function fetchCanvasContent(canvasId: string): Promise<string> {
  const res = await fetch(`https://slack.com/api/canvases.sections.lookup`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ canvas_id: canvasId, criteria: { section_types: ['any_header', 'bulleted_list', 'numbered_list', 'paragraph'] } }),
  })
  const data = await res.json() as { ok: boolean; sections?: Array<{ elements: Array<{ text?: string }> }> }
  if (!data.ok) throw new Error('Failed to fetch canvas content')

  // Flatten all text from sections
  return (data.sections ?? [])
    .flatMap(s => s.elements ?? [])
    .map(e => e.text ?? '')
    .join('\n')
}

// Use Claude to parse canvas text into structured guest records
async function parseGuestsFromCanvas(canvasText: string, tripName: string): Promise<GuestUpdate[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are parsing a Slack canvas that contains travel roster information for the trip "${tripName}".

Extract all guest/traveler records from the following canvas text and return them as a JSON array.

Each record should have these fields (use null if not present):
- name (string, required)
- phone_number (string or null)
- arrival_date (string YYYY-MM-DD or null)
- arrival_time (string HH:MM:SS or null, 24h format)
- departure_date (string YYYY-MM-DD or null)
- departure_time (string HH:MM:SS or null, 24h format)
- hotel_confirmation (string or null)
- bonvoy_number (string or null)
- notes (string or null)

Return ONLY a JSON array, no explanation. If no guests are found, return [].

Canvas text:
${canvasText}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

type GuestUpdate = {
  name: string
  phone_number: string | null
  arrival_date: string | null
  arrival_time: string | null
  departure_date: string | null
  departure_time: string | null
  hotel_confirmation: string | null
  bonvoy_number: string | null
  notes: string | null
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Handle Slack URL verification challenge
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge })
  }

  // Verify signature for all other requests
  if (!verifySlackSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only process canvas update events
  const event = payload.event as Record<string, unknown> | undefined
  if (!event || event.type !== 'canvas_updated') {
    return NextResponse.json({ ok: true })
  }

  const canvasId = event.canvas_id as string
  if (!canvasId) return NextResponse.json({ ok: true })

  try {
    const supabase = createServiceRoleClient()

    // Find the trip that owns this canvas
    const { data: trips } = await supabase
      .from('trips')
      .select('id, name, slack_canvas_url')

    const trip = (trips ?? []).find(t => {
      if (!t.slack_canvas_url) return false
      const id = extractCanvasId(t.slack_canvas_url)
      return id === canvasId
    }) as { id: string; name: string; slack_canvas_url: string } | undefined

    if (!trip) {
      console.log(`No trip found for canvas ${canvasId}`)
      return NextResponse.json({ ok: true })
    }

    // Fetch canvas content and parse guests
    const canvasText = await fetchCanvasContent(canvasId)
    const parsedGuests = await parseGuestsFromCanvas(canvasText, trip.name)

    if (parsedGuests.length === 0) {
      return NextResponse.json({ ok: true, message: 'No guests parsed' })
    }

    // Upsert guests by name (match on name + trip_id)
    for (const guest of parsedGuests) {
      const { data: existing } = await supabase
        .from('guests')
        .select('id')
        .eq('trip_id', trip.id)
        .ilike('name', guest.name.trim())
        .single()

      if (existing) {
        // Update existing guest
        await supabase
          .from('guests')
          .update({
            phone_number: guest.phone_number,
            arrival_date: guest.arrival_date,
            arrival_time: guest.arrival_time,
            departure_date: guest.departure_date,
            departure_time: guest.departure_time,
            hotel_confirmation: guest.hotel_confirmation,
            bonvoy_number: guest.bonvoy_number,
            notes: guest.notes,
          } as Record<string, unknown>)
          .eq('id', (existing as { id: string }).id)
      } else {
        // Insert new guest
        await supabase
          .from('guests')
          .insert({
            trip_id: trip.id,
            name: guest.name.trim(),
            phone_number: guest.phone_number,
            arrival_date: guest.arrival_date,
            arrival_time: guest.arrival_time,
            departure_date: guest.departure_date,
            departure_time: guest.departure_time,
            hotel_confirmation: guest.hotel_confirmation,
            bonvoy_number: guest.bonvoy_number,
            notes: guest.notes,
          } as Record<string, unknown>)
      }
    }

    console.log(`Synced ${parsedGuests.length} guests for trip "${trip.name}"`)
    return NextResponse.json({ ok: true, synced: parsedGuests.length })
  } catch (err) {
    console.error('Canvas sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
