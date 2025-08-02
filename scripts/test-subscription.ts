import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubscription() {
  try {
    console.log('Testing subscription system...')
    
    // Test 1: Check if subscriptions table exists and has the right structure
    console.log('\n1. Testing subscriptions table structure...')
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error accessing subscriptions table:', error)
    } else {
      console.log('✅ Subscriptions table is accessible')
      if (subscriptions && subscriptions.length > 0) {
        console.log('Sample subscription data:', subscriptions[0])
      } else {
        console.log('No subscriptions found in table')
      }
    }
    
    // Test 2: Check if we can insert a test subscription
    console.log('\n2. Testing subscription insertion...')
    const testSubscription: any = {
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      stripe_subscription_id: 'test_sub_123',
      stripe_customer_id: 'test_customer_123',
      status: 'active',
      price_id: 'test_price_123',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }
    
    // Try to add plan field if it exists
    try {
      const { error: planTestError } = await supabase
        .from('subscriptions')
        .select('plan')
        .limit(1)
      
      if (!planTestError) {
        testSubscription.plan = 'pro'
      }
    } catch (error) {
      console.log('Plan column not available')
    }
    
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert([testSubscription])
    
    if (insertError) {
      console.error('Error inserting test subscription:', insertError)
    } else {
      console.log('✅ Test subscription inserted successfully')
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('stripe_subscription_id', 'test_sub_123')
      
      if (deleteError) {
        console.error('Error cleaning up test data:', deleteError)
      } else {
        console.log('✅ Test data cleaned up')
      }
    }
    
    // Test 3: Check profiles table
    console.log('\n3. Testing profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('Error accessing profiles table:', profilesError)
    } else {
      console.log('✅ Profiles table is accessible')
    }
    
    console.log('\n✅ Subscription system test completed!')
    
  } catch (error) {
    console.error('Error in testSubscription:', error)
  }
}

testSubscription() 