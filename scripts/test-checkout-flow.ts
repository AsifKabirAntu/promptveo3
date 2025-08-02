import { config } from 'dotenv'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const stripeSecretKey = process.env.STRIPE_SECRET_KEY!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
})

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCheckoutFlow() {
  try {
    console.log('Testing complete checkout flow...')
    
    // Get a real user from the database
    console.log('\n1. Getting a real user...')
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (userError || !users || users.length === 0) {
      console.error('No users found:', userError)
      return
    }
    
    const user = users[0]
    console.log('Using user:', {
      id: user.id,
      email: user.email,
      name: user.name
    })
    
    // Create a customer in Stripe
    console.log('\n2. Creating customer in Stripe...')
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id
      }
    })
    console.log('✅ Customer created:', customer.id)
    
    // Create a subscription in Stripe (this would normally happen after checkout)
    console.log('\n3. Creating subscription in Stripe...')
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRO_MONTHLY_PRICE_ID! }],
      metadata: {
        userId: user.id
      },
      // Set to active immediately for testing
      trial_end: 'now'
    })
    console.log('✅ Subscription created:', subscription.id)
    console.log('Subscription status:', subscription.status)
    
    // Wait a moment for the webhook to process
    console.log('\n4. Waiting for webhook to process...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if subscription was created in database
    console.log('\n5. Checking database for subscription...')
    const { data: dbSubscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (dbError) {
      console.error('Error checking database subscription:', dbError)
    } else if (dbSubscription) {
      console.log('✅ Subscription found in database:', {
        id: dbSubscription.id,
        user_id: dbSubscription.user_id,
        status: dbSubscription.status,
        plan: dbSubscription.plan,
        stripe_subscription_id: dbSubscription.stripe_subscription_id
      })
    } else {
      console.log('❌ Subscription not found in database')
    }
    
    // Test the frontend subscription check
    console.log('\n6. Testing frontend subscription check...')
    
    // Create a client-side Supabase client
    const clientSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // This will fail due to RLS, but let's see what happens
    const { data: clientSub, error: clientError } = await clientSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (clientError) {
      console.log('Client error (expected due to RLS):', clientError.message)
    } else {
      console.log('✅ Client fetched subscription:', clientSub)
    }
    
    // Clean up
    console.log('\n7. Cleaning up test data...')
    await stripe.subscriptions.cancel(subscription.id)
    await stripe.customers.del(customer.id)
    
    if (dbSubscription) {
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
      
      if (deleteError) {
        console.error('Error cleaning up database subscription:', deleteError)
      } else {
        console.log('✅ Database subscription cleaned up')
      }
    }
    
    console.log('✅ Stripe test data cleaned up')
    console.log('\n✅ Checkout flow test completed!')
    
  } catch (error) {
    console.error('Error in testCheckoutFlow:', error)
  }
}

testCheckoutFlow() 