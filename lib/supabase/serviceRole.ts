import { createClient } from '@supabase/supabase-js'

// Bypasses RLS entirely — only for server routes that verify the caller some other
// way (HMAC signature, calendar-subscription URL) and therefore have no user session.
// Never import this into client-side code or a route that trusts arbitrary callers.
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
