import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createCustomerPortalSession, getCustomerByEmail } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
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

    // Get Stripe customer
    const customer = await getCustomerByEmail(user.email!)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const session = await createCustomerPortalSession({
      customerId: customer.id,
      returnUrl: `${request.nextUrl.origin}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Customer portal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 