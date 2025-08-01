import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    // Handle OAuth errors
    return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // Exchange the authorization code for a session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('OAuth exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent(exchangeError.message)}`)
      }
    } catch (err) {
      console.error('OAuth callback error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
} 