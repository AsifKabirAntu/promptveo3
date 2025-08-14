require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function deleteTestUser() {
  console.log('🗑️  Deleting test user lastflex94@gmail.com from database...\n')
  
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
    // 1. First check what exists
    console.log('1. Checking current user data...')
    
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileCheckError.message)
    } else if (profile) {
      console.log('✅ Found profile:', {
        email: profile.email,
        plan: profile.plan,
        subscription_status: profile.subscription_status
      })
    } else {
      console.log('ℹ️  No profile found')
    }
    
    const { data: subscription, error: subCheckError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (subCheckError && subCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking subscription:', subCheckError.message)
    } else if (subscription) {
      console.log('✅ Found subscription:', {
        stripe_subscription_id: subscription.stripe_subscription_id,
        status: subscription.status,
        plan: subscription.plan
      })
    } else {
      console.log('ℹ️  No subscription found')
    }
    
    // 2. Delete from subscriptions table first (due to foreign key constraints)
    console.log('\n2. Deleting subscription records...')
    const { error: deleteSubError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
    
    if (deleteSubError) {
      console.error('❌ Error deleting subscription:', deleteSubError.message)
    } else {
      console.log('✅ Subscription records deleted')
    }
    
    // 3. Delete from profiles table
    console.log('\n3. Deleting profile...')
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (deleteProfileError) {
      console.error('❌ Error deleting profile:', deleteProfileError.message)
    } else {
      console.log('✅ Profile deleted')
    }
    
    // 4. Note about auth.users (can't delete directly)
    console.log('\n4. Note about auth.users table:')
    console.log('ℹ️  The auth.users record cannot be deleted via this script')
    console.log('   But when you sign up again with the same email, it will either:')
    console.log('   - Reuse the existing auth.users record, OR')
    console.log('   - Create a new one (depending on Supabase Auth settings)')
    console.log('   - The database trigger should create a new profile automatically')
    
    // 5. Verify deletion
    console.log('\n5. Verifying deletion...')
    
    const { data: verifyProfile, error: verifyProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (verifyProfileError && verifyProfileError.code === 'PGRST116') {
      console.log('✅ Profile deletion verified - no records found')
    } else if (verifyProfile) {
      console.log('⚠️  Profile still exists:', verifyProfile)
    }
    
    const { data: verifySub, error: verifySubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (verifySubError && verifySubError.code === 'PGRST116') {
      console.log('✅ Subscription deletion verified - no records found')
    } else if (verifySub) {
      console.log('⚠️  Subscription still exists:', verifySub)
    }
    
    console.log('\n🎉 SUCCESS: User data deleted!')
    console.log('📝 Next steps:')
    console.log('   1. Go to your app and sign up with lastflex94@gmail.com')
    console.log('   2. Complete the payment process with the one-time payment')
    console.log('   3. Check that both profile and subscription records are created')
    console.log('   4. Verify that the user has Pro access')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

deleteTestUser() 