require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function fixSpecificUserSubscription() {
  console.log('🔧 Fixing subscription for lastflex94@gmail.com...\n')
  
  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Find the specific user by email
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    const targetUser = users.find(user => user.email === 'lastflex94@gmail.com')
    
    if (!targetUser) {
      console.error('❌ User lastflex94@gmail.com not found')
      console.log('Available users:')
      users.forEach(user => console.log(`  - ${user.email} (${user.id})`))
      return
    }
    
    console.log(`📧 Found user: ${targetUser.email}`)
    console.log(`🆔 User ID: ${targetUser.id}`)
    
    // Check current status
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()
    
    console.log(`\n📊 Current status: ${currentProfile?.plan || 'free'} plan`)
    
    // 1. Update the profile to Pro
    console.log('\n1. Updating profile to Pro...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        subscription_id: `onetime_lastflex_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUser.id)
    
    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
    } else {
      console.log('✅ Profile updated to Pro')
    }
    
    // 2. Create a subscription record (attempt)
    console.log('\n2. Attempting to create subscription record...')
    const subscriptionData = {
      user_id: targetUser.id,
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
      console.log('⚠️  Subscription table issue (expected):', subscriptionError.message)
      console.log('   This is OK - profile update is sufficient for Pro access')
    } else {
      console.log('✅ Subscription record created')
    }
    
    // 3. Verify the changes
    console.log('\n3. Verifying changes...')
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single()
    
    console.log('✅ Updated Profile:')
    console.log(`   Plan: ${updatedProfile.plan}`)
    console.log(`   Status: ${updatedProfile.subscription_status}`)
    console.log(`   Subscription ID: ${updatedProfile.subscription_id}`)
    
    console.log('\n🎉 lastflex94@gmail.com should now have Pro access!')
    console.log('💡 Try refreshing the dashboard in your browser.')
    console.log('🔄 The subscription system checks the profile table first.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixSpecificUserSubscription().catch(console.error) 