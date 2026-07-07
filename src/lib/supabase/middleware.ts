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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the user's role from app_metadata (set by server), defaulting to 'student' if none.
  const role = user?.app_metadata?.role || 'student'

  const path = request.nextUrl.pathname

  // Protected routes pattern
  const isSuperadminRoute = path.startsWith('/superadmin')
  const isVendorRoute = path.startsWith('/vendor') && !path.startsWith('/vendor/sign-in') && !path.startsWith('/vendor/apply')
  const isStudentRoute = path.startsWith('/student') && !path.startsWith('/student/sign-in') && !path.startsWith('/student/sign-up')

  // If no user, redirect them to the appropriate login page based on the route they tried to access
  if (!user && (isSuperadminRoute || isVendorRoute || isStudentRoute)) {
    // If they hit /superadmin without being logged in, redirect to home (since login is on /superadmin)
    // Wait, superadmin login IS /superadmin. So we should NOT redirect if path === '/superadmin'.
    if (path === '/superadmin') {
      return supabaseResponse
    }
    
    if (isVendorRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/vendor/sign-in'
      return NextResponse.redirect(url)
    }

    // Default redirect for students
    const url = request.nextUrl.clone()
    url.pathname = '/student/sign-in'
    return NextResponse.redirect(url)
  }

  // Enforce role boundaries for logged-in users
  if (user) {
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
