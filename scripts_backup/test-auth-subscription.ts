import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testAuthAndSubscription() {
  console.log('=== Testing Authentication and Subscription ===')
  
  const supabase = createClientComponentClient<Database>()
  
  try {
    // 1. Test authentication
    console.log('1. Testing authentication...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    if (!session) {
      console.log('❌ No session found - user not authenticated')
      return
    }
    
    console.log('✅ User authenticated:', session.user.id, session.user.email)
    
    // 2. Test subscription query
    console.log('2. Testing subscription query...')
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (subError) {
      console.error('❌ Subscription query error:', subError)
      return
    }
    
    if (!subscription) {
      console.log('❌ No subscription found for user')
      return
    }
    
    console.log('✅ Subscription found:', {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      stripe_subscription_id: subscription.stripe_subscription_id
    })
    
    // 3. Test profiles table
    console.log('3. Testing profiles table...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError)
      return
    }
    
    console.log('✅ Profile found:', {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      plan: profile.plan
    })
    
    // 4. Test profiles table
    console.log('4. Testing profiles table...')
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (userProfileError) {
      console.error('❌ User profile query error:', userProfileError)
      return
    }
    
    console.log('✅ User profile found:', {
      id: userProfile.id,
      user_id: userProfile.user_id,
      full_name: userProfile.full_name
    })
    
    console.log('\n🎉 All tests passed! Authentication and subscription system working correctly.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testAuthAndSubscription() 