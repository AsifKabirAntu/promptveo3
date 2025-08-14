require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

async function checkTrigger() {
  console.log('🔍 Checking database trigger status...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // First, let's check current profiles count
    console.log('1. Current profiles count...')
    const { count: profilesCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting profiles:', countError.message)
    } else {
      console.log(`📊 Current profiles in database: ${profilesCount}`)
    }
    
    // Check if the specific user is in profiles
    console.log('\n2. Checking for lastflex94@gmail.com...')
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'lastflex94@gmail.com')
      .single()
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('❌ lastflex94@gmail.com profile does NOT exist')
      } else {
        console.error('❌ Error checking user profile:', userError.message)
      }
    } else {
      console.log('✅ lastflex94@gmail.com profile exists:')
      console.log('   Plan:', userProfile.plan)
      console.log('   Status:', userProfile.subscription_status)
      console.log('   Created:', userProfile.created_at)
    }
    
    // Now let's see the last few profiles created
    console.log('\n3. Last few profiles created...')
    const { data: recentProfiles, error: recentError } = await supabase
      .from('profiles')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (recentError) {
      console.error('❌ Error fetching recent profiles:', recentError.message)
    } else {
      console.log('📋 Recent profiles:')
      recentProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.name}) - ${profile.created_at}`)
      })
    }
    
    // Check if we can create a test profile manually
    console.log('\n4. Testing manual profile creation...')
    
    const testUserId = uuidv4()
    const testEmail = `test+${Date.now()}@example.com`
    
    console.log(`   Creating test profile with ID: ${testUserId}`)
    
    const { data: testResult, error: testError } = await supabase
      .from('profiles')
      .insert([{
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        plan: 'free'
      }])
      .select()
    
    if (testError) {
      console.error('❌ Error creating test profile:', testError.message)
    } else {
      console.log('✅ Test profile created successfully')
      
      // Clean up test profile
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', testUserId)
      
      if (deleteError) {
        console.error('⚠️  Could not delete test profile:', deleteError.message)
      } else {
        console.log('✅ Test profile cleaned up')
      }
    }
    
    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`   Total profiles: ${profilesCount}`)
    console.log(`   lastflex94@gmail.com exists: ${userProfile ? 'YES' : 'NO'}`)
    if (userProfile) {
      console.log(`   User plan: ${userProfile.plan}`)
      console.log(`   User status: ${userProfile.subscription_status || 'null'}`)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkTrigger() 