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

async function testWebhook() {
  try {
    console.log('Testing webhook functionality...')
    
    // First, let's check if there are any existing subscriptions
    console.log('\n1. Checking existing subscriptions...')
    const { data: existingSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
    
    if (subError) {
      console.error('Error checking subscriptions:', subError)
    } else {
      console.log(`Found ${existingSubs?.length || 0} existing subscriptions`)
      if (existingSubs && existingSubs.length > 0) {
        console.log('Sample subscription:', existingSubs[0])
      }
    }
    
    // Check if there are any users in the profiles table
    console.log('\n2. Checking users...')
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (userError) {
      console.error('Error checking users:', userError)
    } else {
      console.log(`Found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('Sample user:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name
        })
      }
    }
    
    // Create a test subscription in Stripe
    console.log('\n3. Creating test subscription in Stripe...')
    const testCustomer = await stripe.customers.create({
      email: 'test-webhook@example.com',
      name: 'Test Webhook Customer',
      metadata: {
        userId: users?.[0]?.id || 'test-user-id'
      }
    })
    
    const testSubscription = await stripe.subscriptions.create({
      customer: testCustomer.id,
      items: [{ price: process.env.STRIPE_PRO_MONTHLY_PRICE_ID! }],
      metadata: {
        userId: users?.[0]?.id || 'test-user-id'
      }
    })
    
    console.log('✅ Test subscription created in Stripe:', testSubscription.id)
    
    // Now simulate the webhook event
    console.log('\n4. Simulating webhook event...')
    
    // Create a webhook event payload
    const eventPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: testSubscription
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_webhook',
        idempotency_key: null
      },
      type: 'customer.subscription.created'
    }
    
    // Sign the event
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    const signedPayload = stripe.webhooks.generateTestHeaderString({
      payload: JSON.stringify(eventPayload),
      secret: webhookSecret,
    })
    
    console.log('✅ Webhook event signed')
    
    // Now call our webhook endpoint directly
    console.log('\n5. Calling webhook endpoint...')
    
    const webhookUrl = 'http://localhost:3000/api/billing/webhook'
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signedPayload
      },
      body: JSON.stringify(eventPayload)
    })
    
    console.log('Webhook response status:', response.status)
    const responseText = await response.text()
    console.log('Webhook response:', responseText)
    
    // Check if subscription was created in database
    console.log('\n6. Checking if subscription was created...')
    const { data: newSubs, error: newSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', testSubscription.id)
    
    if (newSubError) {
      console.error('Error checking new subscription:', newSubError)
    } else {
      console.log(`Found ${newSubs?.length || 0} subscriptions with ID ${testSubscription.id}`)
      if (newSubs && newSubs.length > 0) {
        console.log('✅ Subscription created in database:', newSubs[0])
      } else {
        console.log('❌ Subscription not found in database')
      }
    }
    
    // Clean up
    console.log('\n7. Cleaning up test data...')
    await stripe.subscriptions.cancel(testSubscription.id)
    await stripe.customers.del(testCustomer.id)
    console.log('✅ Test data cleaned up')
    
    console.log('\n✅ Webhook test completed!')
    
  } catch (error) {
    console.error('Error in testWebhook:', error)
  }
}

testWebhook() 