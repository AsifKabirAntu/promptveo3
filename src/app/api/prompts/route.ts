import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Fetching prompts from server-side API...')
    
    // Fetch regular prompts
    const { data: regularPrompts, error: regularError } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (regularError) {
      console.error('Error fetching regular prompts:', regularError)
      return NextResponse.json(
        { error: 'Failed to fetch regular prompts' },
        { status: 500 }
      )
    }

    // Fetch timeline prompts
    const { data: timelinePrompts, error: timelineError } = await supabase
      .from('timeline_prompts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (timelineError) {
      console.error('Error fetching timeline prompts:', timelineError)
      return NextResponse.json(
        { error: 'Failed to fetch timeline prompts' },
        { status: 500 }
      )
    }

    console.log(`Successfully fetched ${regularPrompts?.length || 0} regular prompts and ${timelinePrompts?.length || 0} timeline prompts`)

    return NextResponse.json({
      regularPrompts: regularPrompts || [],
      timelinePrompts: timelinePrompts || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 