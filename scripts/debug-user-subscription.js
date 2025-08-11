require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugUserSubscription() {
  console.log('🔍 Debugging user subscription status...\n')
  
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Get all users to find the current user
    console.log('1. Fetching all users...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`✅ Found ${users.length} users`)
    
    // Get the most recent user (likely the test user)
    const recentUser = users[users.length - 1]
    console.log(`\n📧 Most recent user: ${recentUser.email}`)
    console.log(`🆔 User ID: ${recentUser.id}`)
    
    // Check profiles table
    console.log('\n2. Checking profiles table...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', recentUser.id)
      .single()
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
    } else if (profile) {
      console.log('✅ Profile found:')
      console.log(`   Plan: ${profile.plan || 'free'}`)
      console.log(`   Subscription Status: ${profile.subscription_status || 'none'}`)
      console.log(`   Subscription ID: ${profile.subscription_id || 'none'}`)
    } else {
      console.log('❌ No profile found')
    }
    
    // Check subscriptions table
    console.log('\n3. Checking subscriptions table...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', recentUser.id)
    
    if (subError) {
      console.log('❌ Subscriptions error:', subError.message)
    } else if (subscriptions && subscriptions.length > 0) {
      console.log('✅ Subscriptions found:')
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ID: ${sub.subscription_id}`)
        console.log(`      Status: ${sub.status}`)
        console.log(`      Plan: ${sub.plan}`)
        console.log(`      Price ID: ${sub.price_id}`)
        console.log(`      Created: ${sub.created_at}`)
      })
    } else {
      console.log('❌ No subscriptions found')
    }
    
    // Check RLS policies
    console.log('\n4. Testing table access with user context...')
    
    // Simulate user context
    const { data: userSession, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: recentUser.email
    })
    
    if (sessionError) {
      console.log('❌ Could not generate user session for testing')
    } else {
      console.log('✅ User session context available for testing')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugUserSubscription().catch(console.error) 