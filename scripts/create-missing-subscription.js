require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createMissingSubscription() {
  console.log('🔧 Creating missing subscription record for lastflex94@gmail.com...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const userId = '6cecd3d2-20da-496a-9004-bff621c57112'
  const userEmail = 'lastflex94@gmail.com'
  
  try {
    // Check if subscription already exists
    console.log('1. Checking if subscription already exists...')
    const { data: existingSub, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing subscription:', checkError.message)
      return
    }
    
    if (existingSub) {
      console.log('✅ Subscription already exists:', existingSub)
      return
    }
    
    console.log('❌ No subscription found, creating one...')
    
    // Create subscription record
    console.log('2. Creating subscription record...')
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: `onetime_manual_${Date.now()}`, // Manual identifier
      status: 'active',
      plan: 'pro',
      price_id: 'onetime_manual', // Indicating manual creation
      current_period_start: new Date().toISOString(),
      current_period_end: null, // null = lifetime access
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('   Subscription data:', subscriptionData)
    
    const { data: newSub, error: subError } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single()
    
    if (subError) {
      console.error('❌ Error creating subscription:', subError.message)
      return
    }
    
    console.log('✅ Subscription created successfully:', newSub)
    
    // Update profile subscription_id reference
    console.log('3. Updating profile subscription reference...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_id: subscriptionData.stripe_subscription_id,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (profileError) {
      console.error('⚠️  Error updating profile:', profileError.message)
    } else {
      console.log('✅ Profile updated with subscription reference')
    }
    
    // Verify the setup
    console.log('4. Verifying the complete setup...')
    const { data: finalProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, email, plan, subscription_status, subscription_id')
      .eq('id', userId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying profile:', verifyError.message)
    } else {
      console.log('✅ Final profile state:', finalProfile)
    }
    
    const { data: finalSub, error: subVerifyError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (subVerifyError) {
      console.error('❌ Error verifying subscription:', subVerifyError.message)
    } else {
      console.log('✅ Final subscription state:', finalSub)
    }
    
    console.log('\n🎉 SUCCESS: User should now have complete Pro access!')
    console.log('   - Profile: Pro plan with active status')
    console.log('   - Subscription: Active record for payment tracking')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createMissingSubscription() 