require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function createMissingProfile() {
  console.log('🔧 Creating missing profile for lastflex94@gmail.com...\n')
  
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
    // Get the user's email from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('❌ Could not get auth user:', authError)
      return
    }
    
    const email = authUser.user.email
    console.log(`📧 Creating profile for: ${email}`)
    
    // Create the profile with all required fields
    const profileData = {
      id: userId,
      email: email,
      plan: 'pro',
      subscription_status: 'active',
      subscription_id: `onetime_manual_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Creating profile with data:', profileData)
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      
      // Try updating instead (maybe profile exists but we couldn't find it)
      console.log('\nTrying to update existing profile...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: 'pro',
          subscription_status: 'active',
          subscription_id: `onetime_manual_${Date.now()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (updateError) {
        console.error('❌ Update also failed:', updateError)
      } else {
        console.log('✅ Profile updated successfully')
      }
    } else {
      console.log('✅ Profile created successfully:', newProfile)
    }
    
    // Verify the profile exists now
    console.log('\n🔍 Verifying profile...')
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
    } else {
      console.log('✅ Profile verified:')
      console.log(`   Email: ${verifyProfile.email}`)
      console.log(`   Plan: ${verifyProfile.plan}`)
      console.log(`   Status: ${verifyProfile.subscription_status}`)
    }
    
    console.log('\n🎉 Profile setup complete!')
    console.log('💡 Try refreshing your dashboard now.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createMissingProfile().catch(console.error) 