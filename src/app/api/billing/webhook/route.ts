import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe is not initialized')
    return NextResponse.json(
      { error: 'Stripe not initialized' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.log('Webhook event received:', event.type)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = supabaseAdmin

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          console.log('Checkout session completed:', session.id)
          
          if (session.mode === 'subscription' && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            )
            console.log('Retrieved subscription:', subscription.id)
            
            await handleSubscriptionChange(subscription, supabase)
          }
          break
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          console.log('Subscription event:', event.type, subscription.id)
          await handleSubscriptionChange(subscription, supabase)
          break
        }
        
        default:
          console.warn('Unhandled relevant event:', event.type)
      }
    } catch (error) {
      console.error('Error handling webhook:', error)
      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata.userId
  
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  console.log('Processing subscription change for user:', userId)
  console.log('Subscription status:', subscription.status)
  console.log('Subscription ID:', subscription.id)

  // Determine subscription status
  let status = subscription.status
  if (status === 'trialing') {
    status = 'active' // Treat trials as active
  }

  // Always set plan to 'pro' for active subscriptions
  const plan = status === 'active' ? 'pro' : 'free'
  const priceId = subscription.items.data[0]?.price.id

  console.log('Price ID:', priceId)
  console.log('Status determined:', status)
  console.log('Plan determined:', plan)

  // Upsert subscription record using correct column names
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    status,
    plan,
    price_id: priceId,
    current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log('Upserting subscription data:', subscriptionData)

  // First try to update existing subscription
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching existing subscription:', fetchError)
    throw fetchError
  }

  let result
  if (existingSubscription) {
    // Update existing subscription
    console.log('Updating existing subscription for user:', userId)
    result = await supabase
      .from('subscriptions')
      .update(subscriptionData)
      .eq('user_id', userId)
  } else {
    // Insert new subscription
    console.log('Creating new subscription for user:', userId)
    result = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
  }

  if (result.error) {
    console.error('Error upserting subscription:', result.error)
    throw result.error
  } else {
    console.log('Successfully updated subscription for user:', userId)
    console.log('Final subscription data:', subscriptionData)
  }
} 