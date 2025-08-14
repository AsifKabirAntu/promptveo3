require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function debugSpecificUser() {
  console.log('🔍 Debugging user 6cecd3d2-20da-496a-9004-bff621c57112...\n')
  
  // Create Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const userId = '6cecd3d2-20da-496a-9004-bff621c57112'
  
  try {
    // 1. Check if user exists in auth
    console.log('1. Checking auth user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return
    }
    
    if (authUser.user) {
      console.log(`✅ Auth user found: ${authUser.user.email}`)
    } else {
      console.log('❌ No auth user found')
      return
    }
    
    // 2. Check profiles table directly
    console.log('\n2. Checking profiles table (admin)...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
      if (profileError.code === 'PGRST116') {
        console.log('   This means no profile record exists for this user')
        
        // Try to create a profile
        console.log('\n   Creating missing profile...')
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            plan: 'pro',
            subscription_status: 'active',
            subscription_id: `onetime_manual_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (createError) {
          console.log('   ❌ Could not create profile:', createError.message)
        } else {
          console.log('   ✅ Profile created successfully')
        }
      }
    } else if (profile) {
      console.log('✅ Profile found:')
      console.log(`   Plan: ${profile.plan}`)
      console.log(`   Status: ${profile.subscription_status}`)
      console.log(`   Subscription ID: ${profile.subscription_id}`)
    }
    
    // 3. Check subscriptions table
    console.log('\n3. Checking subscriptions table...')
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
    
    if (subError) {
      console.log('❌ Subscriptions error:', subError.message)
    } else if (subscriptions && subscriptions.length > 0) {
      console.log('✅ Subscriptions found:')
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Status: ${sub.status}, Plan: ${sub.plan}`)
      })
    } else {
      console.log('❌ No subscriptions found')
    }
    
    // 4. Test with anon key (simulate frontend)
    console.log('\n4. Testing with anon key (simulating frontend)...')
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // This will fail because there's no auth session
    const { data: anonProfile, error: anonError } = await anonClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (anonError) {
      console.log('❌ Anon client error (expected):', anonError.message)
      console.log('   This is why the frontend is getting 406 errors')
    }
    
    console.log('\n📋 Summary:')
    console.log('- User needs to be signed in for RLS policies to work')
    console.log('- Frontend queries fail because user context is missing')
    console.log('- Profile may be missing entirely')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugSpecificUser().catch(console.error) 