import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('Test session API - Session:', session ? 'Found' : 'Not found')
    console.log('Test session API - Error:', error)
    console.log('Test session API - User ID:', session?.user?.id)
    
    return NextResponse.json({
      hasSession: !!session,
      userId: session?.user?.id,
      error: error?.message,
      cookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' }))
    })
  } catch (error) {
    console.error('Test session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 