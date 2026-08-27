import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Student routes that require a signed-in account. Browsing (explore, deal
  // detail pages) is open to guests — only checking out, viewing orders, or
  // touching KYC/profile data requires auth.
  const STUDENT_AUTH_REQUIRED_PREFIXES = [
    '/student/checkout',
    '/student/orders',
    '/student/profile',
    '/student/saved',
    '/student/upload-id',
    '/student/verify',
    '/student/order-confirmed',
  ]

  // Protected routes pattern
  const isSuperadminRoute = path.startsWith('/superadmin')
  const isVendorRoute = path.startsWith('/vendor') && !path.startsWith('/vendor/sign-in') && !path.startsWith('/vendor/apply')
  const isStudentRoute = STUDENT_AUTH_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix))
  
  // Auth routes that we want to redirect users away from if they are already logged in
  const isAuthRoute = path.startsWith('/student/sign-in') || path.startsWith('/student/sign-up') || path.startsWith('/vendor/sign-in') || path.startsWith('/vendor/apply') || path.startsWith('/auth/reset-password')

  // real network round-trip — unlike getSession(), which just reads the
  // local cookie) so it's the only safe way to trust a role/account_status
  // claim in middleware. That round-trip is real latency (~100-500ms), so
  // only pay it on routes whose logic below actually depends on the result.
  // Pages outside these categories (landing page, guest-browsable explore/deal pages) 
  // never read `user` at all.
  if (!isSuperadminRoute && !isVendorRoute && !isStudentRoute && !isAuthRoute) {
    return supabaseResponse
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the user's role from app_metadata (set by server), defaulting to 'student' if none.
  const role = user?.app_metadata?.role || 'student'
  const accountStatus = user?.app_metadata?.account_status || 'active'

  // If no user, serve the sign-in page for the route they tried to access —
  // via rewrite, not redirect, so the address bar still shows the page they
  // were trying to reach instead of exposing "/student/sign-in" and leaking
  // that the page is gated. No ?next= is needed here: since the URL never
  // actually changes, the sign-in page just does a router.refresh() on
  // success and middleware re-evaluates the (now authenticated) request
  // against the same, unchanged URL.
  if (!user && (isSuperadminRoute || isVendorRoute || isStudentRoute)) {
    // If they hit /superadmin without being logged in, redirect to home (since login is on /superadmin)
    // Wait, superadmin login IS /superadmin. So we should NOT redirect if path === '/superadmin'.
    if (path === '/superadmin') {
      return supabaseResponse
    }

    if (isVendorRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/sign-in'
      return NextResponse.rewrite(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/student/sign-in'
    return NextResponse.rewrite(url)
  }

  // Enforce role boundaries for logged-in users
  if (user) {
    if (accountStatus === 'revoked') {
      // Redirect revoked users to an error page instead of a sign-in page to avoid infinite loops
      // since their session technically still exists but is invalid for our app.
      const url = request.nextUrl.clone()
      url.pathname = '/auth/auth-code-error'

      if (path !== url.pathname) {
        return NextResponse.redirect(url)
      }
    }

    if (isAuthRoute && accountStatus !== 'revoked') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'vendor' ? '/vendor/dashboard' : role === 'superadmin' ? '/superadmin' : '/student/explore'
      return NextResponse.redirect(url)
    }

    if (isSuperadminRoute && role !== 'superadmin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    if (isVendorRoute && role !== 'vendor') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'superadmin' ? '/superadmin' : '/student/explore'
      return NextResponse.redirect(url)
    }

    if (isStudentRoute && role !== 'student') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'superadmin' ? '/superadmin' : '/vendor/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
