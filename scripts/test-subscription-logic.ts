import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSubscriptionLogic() {
  try {
    console.log('Testing subscription logic...')
    
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
    
    // Check if user already has a subscription
    console.log('\n2. Checking existing subscription...')
    const { data: existingSub, error: existingError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', existingError)
    } else if (existingSub) {
      console.log('User already has subscription:', existingSub)
    } else {
      console.log('No existing subscription found')
    }
    
    // Create a test subscription directly in the database
    console.log('\n3. Creating test subscription in database...')
    const testSubscription: any = {
      user_id: user.id,
      stripe_customer_id: 'cus_test_' + Date.now(),
      stripe_subscription_id: 'sub_test_' + Date.now(),
      status: 'active',
      price_id: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
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
    
    const { data: newSub, error: insertError } = await supabase
      .from('subscriptions')
      .upsert([testSubscription], { onConflict: 'user_id' })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating test subscription:', insertError)
      return
    }
    
    console.log('✅ Test subscription created:', newSub)
    
    // Now test the client-side subscription fetching
    console.log('\n4. Testing client-side subscription fetching...')
    
    // Create a client-side Supabase client (like the frontend would use)
    const clientSupabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // First, we need to authenticate the user (simulate login)
    console.log('Authenticating user...')
    const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
      email: user.email,
      password: 'test-password' // This won't work, but let's see what happens
    })
    
    if (authError) {
      console.log('Auth error (expected):', authError.message)
      console.log('This is expected since we don\'t have the user\'s password')
    } else {
      console.log('User authenticated:', authData.user?.id)
    }
    
    // Try to fetch subscription (this will fail without proper auth)
    const { data: clientSub, error: clientError } = await clientSupabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (clientError) {
      console.error('Error fetching subscription from client:', clientError)
    } else {
      console.log('✅ Client fetched subscription:', clientSub)
      
      // Test the subscription features logic
      console.log('\n5. Testing subscription features logic...')
      
      const isPro = clientSub?.status === 'active'
      console.log('Is Pro?', isPro, 'Status:', clientSub?.status)
      
      if (isPro) {
        console.log('✅ User should have Pro features')
      } else {
        console.log('❌ User should have Free features')
      }
    }
    
    // Clean up test subscription
    console.log('\n6. Cleaning up test subscription...')
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Error cleaning up test subscription:', deleteError)
    } else {
      console.log('✅ Test subscription cleaned up')
    }
    
    console.log('\n✅ Subscription logic test completed!')
    
  } catch (error) {
    console.error('Error in testSubscriptionLogic:', error)
  }
}

testSubscriptionLogic() 