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

    if (!id) {
      return NextResponse.json(
        { error: 'Prompt ID is required' },
        { status: 400 }
      )
    }

    // Get client IP for basic spam prevention
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIP = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

    // Check if this IP has viewed this prompt recently (basic spam prevention)
    // In production, you might want to use Redis or a more sophisticated cache
    const cacheKey = `view_${id}_${clientIP}`
    
    // For now, we'll just increment the view count without duplicate checking
    // In production, you might want to implement a more sophisticated deduplication mechanism

    // Increment view count
    const { data: newCount, error } = await supabase
      .rpc('increment_view_count', { prompt_id: id })

    if (error) {
      console.error('Error updating view count:', error)
      return NextResponse.json(
        { error: 'Failed to update view count' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      views_count: newCount || 0
    })

  } catch (error) {
    console.error('Error in view tracking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 