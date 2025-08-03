import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// This route needs dynamic rendering because it uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('🔍 Auth callback received:', {
    url: request.url,
    hasCode: !!code,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
  })
  
  // If there's a hash in the URL, we can't access it on the server side
  // So redirect to a client-side handler that can process it
  if (request.url.includes('#')) {
    console.log('Hash detected in URL, redirecting to client-side handler')
    return NextResponse.redirect(new URL('/auth/callback/handle-fragment', requestUrl))
  }

  // Create a Supabase client for the server
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  // If we have a code, exchange it for a session
  if (code) {
    try {
      console.log('Processing authorization code:', code.substring(0, 10) + '...')
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=session_exchange_failed&details=${encodeURIComponent(error.message)}`, requestUrl)
        )
      }
      
      if (!data.session) {
        console.error('❌ No session returned from code exchange')
        return NextResponse.redirect(
          new URL('/auth/signin?error=no_session', requestUrl)
        )
      }
      
      console.log('✅ Session established successfully for user:', data.session.user.email)
      
      // Redirect to the dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl))
    } catch (error: any) {
      console.error('❌ Unexpected error in callback:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=unexpected_error&details=${encodeURIComponent(error.message)}`, requestUrl)
      )
    }
  }
  
  // If we don't have a code or hash, redirect to the sign-in page with an error
  console.error('❌ No code found in callback URL')
  return NextResponse.redirect(
    new URL('/auth/signin?error=no_code', requestUrl)
  )
} 