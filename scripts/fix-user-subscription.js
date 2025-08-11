require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixUserSubscription() {
  console.log('🔧 Fixing user subscription status...\n')
  
  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Get the test user (most recent)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    const user = users[users.length - 1] // Get most recent user
    console.log(`📧 Updating user: ${user.email}`)
    console.log(`🆔 User ID: ${user.id}`)
    
    // 1. Update the profile to Pro
    console.log('\n1. Updating profile to Pro...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        subscription_id: `onetime_test_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
    } else {
      console.log('✅ Profile updated to Pro')
    }
    
    // 2. Create a subscription record
    console.log('\n2. Creating subscription record...')
    const subscriptionData = {
      user_id: user.id,
      subscription_id: `onetime_test_${Date.now()}`,
      status: 'active',
      plan: 'pro',
      price_id: process.env.STRIPE_PRO_ONETIME_PRICE_ID || 'price_test_onetime',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
    
    if (subscriptionError) {
      console.error('❌ Error creating subscription:', subscriptionError)
    } else {
      console.log('✅ Subscription record created')
    }
    
    // 3. Verify the changes
    console.log('\n3. Verifying changes...')
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
    
    console.log('✅ Updated Profile:')
    console.log(`   Plan: ${updatedProfile.plan}`)
    console.log(`   Status: ${updatedProfile.subscription_status}`)
    
    console.log('✅ Subscriptions:')
    console.log(`   Count: ${subscriptions.length}`)
    if (subscriptions.length > 0) {
      console.log(`   Status: ${subscriptions[0].status}`)
      console.log(`   Plan: ${subscriptions[0].plan}`)
    }
    
    console.log('\n🎉 User should now have Pro access!')
    console.log('💡 Try refreshing the dashboard to see the changes.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixUserSubscription().catch(console.error) 