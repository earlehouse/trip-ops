import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any redirect logic
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Only these specific API routes are reachable without a session — each has its own
  // reason it can't send cookies (calendar-subscription apps, Slack's webhook caller).
  // Everything else under /api/ requires login like any other page.
  const PUBLIC_API_PATTERNS = [
    /^\/api\/trips\/[^/]+\/calendar$/, // ICS feed for calendar apps
    /^\/api\/slack\/canvas$/,          // Slack webhook, verified via its own signature check
    /^\/api\/trips$/,                  // office-scheduler read access, verified via its own shared-key check
    /^\/api\/trip-requests$/,          // office-scheduler push access, verified via its own shared-key check
  ]
  const isPublicApi = PUBLIC_API_PATTERNS.some(p => p.test(pathname))

  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/auth') || isPublicApi

  // Not logged in → send to login (skipped in local dev so you can work without a Supabase session)
  if (!user && !isPublic && process.env.NODE_ENV !== 'development') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Already logged in → skip login page
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/trips'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
