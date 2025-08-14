import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { action } = await request.json() // 'like' or 'unlike'

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    if (!action || !['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "like" or "unlike"' },
        { status: 400 }
      )
    }

    // Get client IP for basic tracking (optional, for future analytics)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIP = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

    // Increment or decrement like count based on action
    const functionName = action === 'like' ? 'increment_like_count' : 'decrement_like_count'
    
    const { data: newCount, error } = await supabase
      .rpc(functionName, { prompt_id: id })

    if (error) {
      console.error(`Error ${action}ing prompt:`, error)
      return NextResponse.json(
        { error: `Failed to ${action} prompt` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action,
      likes_count: newCount || 0
    })

  } catch (error) {
    console.error('Error in like tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 