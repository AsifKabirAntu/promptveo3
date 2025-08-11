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

    console.log('Processing checkout request with priceId:', priceId)
    console.log('Available Stripe products:', {
      PRO_ONETIME: STRIPE_PRODUCTS?.PRO_ONETIME,
      PRO_MONTHLY: STRIPE_PRODUCTS?.PRO_MONTHLY,
      PRO_YEARLY: STRIPE_PRODUCTS?.PRO_YEARLY
    })

    // Convert price type to actual price ID and determine mode
    let actualPriceId: string
    let mode: 'payment' | 'subscription' = 'payment'
    
    if (priceId === 'ONETIME') {
      actualPriceId = STRIPE_PRODUCTS.PRO_ONETIME
      mode = 'payment' // Always use payment mode for one-time purchases
      console.log('Using one-time payment with price ID:', actualPriceId)
    } else if (priceId === 'MONTHLY') {
      // Keep for backward compatibility
      actualPriceId = STRIPE_PRODUCTS.PRO_MONTHLY
      mode = 'subscription'
      console.log('Using monthly subscription with price ID:', actualPriceId)
    } else if (priceId === 'YEARLY') {
      // Keep for backward compatibility
      actualPriceId = STRIPE_PRODUCTS.PRO_YEARLY
      mode = 'subscription'
      console.log('Using yearly subscription with price ID:', actualPriceId)
    } else {
      return NextResponse.json(
        { error: 'Invalid price ID. Use ONETIME, MONTHLY, or YEARLY.' },
        { status: 400 }
      )
    }

    if (!actualPriceId) {
      return NextResponse.json(
        { error: `Price ID not configured for ${priceId}. Check environment variables.` },
        { status: 500 }
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
      .select('name')
      .eq('id', user.id)
      .single()

    // Create or get Stripe customer
    const customer = await createOrGetCustomer({
      email: user.email!,
      name: profile?.name || undefined,
      userId: user.id,
    })

    // Create checkout session with appropriate mode
    const session = await createCheckoutSession({
      userId: user.id,
      priceId: actualPriceId,
      mode,
      successUrl: `${request.nextUrl.origin}/dashboard/billing?success=true`,
      cancelUrl: `${request.nextUrl.origin}/dashboard/billing?canceled=true`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
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