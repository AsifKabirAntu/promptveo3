import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createCheckoutSession, createOrGetCustomer, STRIPE_PRODUCTS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    if (!STRIPE_PRODUCTS) {
      return NextResponse.json(
        { error: 'Stripe products not configured' },
        { status: 500 }
      )
    }

    // Convert price type to actual price ID
    let actualPriceId: string
    if (priceId === 'MONTHLY') {
      actualPriceId = STRIPE_PRODUCTS.PRO_MONTHLY
    } else if (priceId === 'YEARLY') {
      actualPriceId = STRIPE_PRODUCTS.PRO_YEARLY
    } else {
      return NextResponse.json(
        { error: 'Invalid price type' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single()

    // Create or get Stripe customer
    const customer = await createOrGetCustomer({
      email: user.email!,
      name: profile?.full_name || undefined,
      userId: user.id,
    })

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      priceId: actualPriceId,
      successUrl: `${request.nextUrl.origin}/dashboard/billing?success=true`,
      cancelUrl: `${request.nextUrl.origin}/dashboard/billing?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    
    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 