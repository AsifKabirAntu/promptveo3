require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkUserRecords() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  console.log('🔍 Checking lastflex94@gmail.com records...\n')
  
  try {
    // 1. Find user by email in auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    const testUser = authUsers.users.find(u => u.email === 'lastflex94@gmail.com')
    
    if (!testUser) {
      console.log('❌ User not found in auth')
      return
    }
    
    console.log('✅ User found in auth:', testUser.id)
    console.log('📅 Created:', testUser.created_at)
    
    // 2. Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUser.id)
      .single()
    
    if (profileError) {
      console.log('❌ No profile found:', profileError.message)
    } else {
      console.log('✅ Profile found:')
      console.log('   Plan:', profile.plan)
      console.log('   Email:', profile.email)
      console.log('   Created:', profile.created_at)
      if (profile.subscription_status) {
        console.log('   Subscription Status:', profile.subscription_status)
      }
    }
    
    // 3. Check subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUser.id)
      .single()
    
    if (subError && subError.code === 'PGRST116') {
      console.log('❌ No subscription record found - this means:')
      console.log('   - Either no payment was made yet')
      console.log('   - Or the webhook did not process correctly')
    } else if (subError) {
      console.log('❌ Error checking subscription:', subError.message)
    } else {
      console.log('✅ Subscription found:')
      console.log('   Status:', subscription.status)
      console.log('   Plan:', subscription.plan)
      console.log('   Stripe ID:', subscription.stripe_subscription_id)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkUserRecords() 