require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function manualWebhookSimulation() {
  console.log('🔧 Manually simulating webhook processing for successful payment...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // User who just paid
  const userId = '6aaeb012-b0b9-4f04-aebe-1bbed362f29c'
  const userEmail = 'lastflex94@gmail.com'
  
  try {
    console.log('1. Creating subscription record...')
    
    // Simulate the webhook creating a subscription record
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: `onetime_manual_${Date.now()}`, // Simulated session ID
      status: 'active',
      plan: 'pro',
      price_id: 'price_1RuyDFEBqzx53Weq2eeQVZJy', // The actual price ID used
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years from now for "lifetime"
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
    
    if (subError) {
      console.error('❌ Error creating subscription:', subError.message)
    } else {
      console.log('✅ Subscription record created successfully')
    }
    
    console.log('\n2. Updating user profile to Pro...')
    
    // Update the profile to Pro
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        subscription_id: subscriptionData.stripe_subscription_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message)
    } else {
      console.log('✅ Profile updated to Pro successfully')
    }
    
    console.log('\n🎉 Manual webhook simulation complete!')
    console.log('✅ User should now have Pro access')
    console.log('💡 Note: Set up Stripe CLI for automatic webhook processing in the future')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

manualWebhookSimulation() 