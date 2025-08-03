import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Skip middleware for callback route
  if (request.nextUrl.pathname.startsWith('/auth/callback')) {
    return res
  }

  // Check if user is authenticated (either via session or localStorage)
  let isAuthenticated = !!session
  
  // If no session, check for auth token in cookies
  if (!isAuthenticated) {
    const authToken = request.cookies.get('sb-hmqanqtadlvtweaoxmuf-auth-token')
    if (authToken) {
      isAuthenticated = true
    }
  }

  // Auth routes handling
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (isAuthenticated) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return res
  }

  // Protected routes handling
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return res
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
} 