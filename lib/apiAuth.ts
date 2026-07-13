import type { NextRequest } from 'next/server'
import crypto from 'crypto'

// Shared-secret check for server-to-server callers (e.g. office-scheduler) that have
// no Supabase session and therefore can't satisfy the normal login/RLS path.
export function isValidServiceKey(req: NextRequest): boolean {
  const expected = process.env.OFFICE_SCHEDULER_API_KEY
  if (!expected) return false

  const header = req.headers.get('authorization') ?? ''
  const provided = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!provided || provided.length !== expected.length) return false

  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}
