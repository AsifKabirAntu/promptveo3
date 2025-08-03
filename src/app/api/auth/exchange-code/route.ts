import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ success: false, error: 'No code provided' })
    }
    
    console.log('🔄 API: Exchanging code for session...')
    console.log('Code:', code.substring(0, 20) + '...')
    
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Exchange the auth code for a session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ API: Error exchanging code:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: {
          status: error.status,
          name: error.name
        }
      })
    }

    if (!session) {
      console.error('❌ API: No session returned')
      return NextResponse.json({ success: false, error: 'No session returned' })
    }

    console.log('✅ API: Session created successfully')
    console.log('User:', session.user.email)
    
    // Set session cookies
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })
    
    // Set cookies
    response.cookies.set('sb-auth-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return response
    
  } catch (err) {
    console.error('❌ API: Unexpected error:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error occurred',
      details: err instanceof Error ? err.message : 'Unknown error'
    })
  }
} 