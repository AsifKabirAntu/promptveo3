/**
 * Update user profile plan to 'pro'
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = envContent
  .split('\n')
  .filter(line => line.trim() !== '' && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=')
    acc[key] = value
    return acc
  }, {})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

async function updateProfilePlan() {
  console.log('🔍 Checking profiles table and updating user plan...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Service Key:', supabaseServiceKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Check profiles table structure
    console.log('\n1. Checking profiles table structure...')
    try {
      const { data: sample, error: sampleError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .limit(1)
        
      if (sampleError) {
        console.error('❌ Error getting sample data:', sampleError)
        return
      } else if (sample && sample.length > 0) {
        console.log('✅ Profiles table structure:')
        console.log(Object.keys(sample[0]))
      } else {
        console.log('⚠️ No sample data found')
        return
      }
    } catch (e) {
      console.error('❌ Error checking table structure:', e)
      return
    }
    
    // 2. Get the user ID to update
    const userId = '13b124ce-aaee-4dcc-a256-fa26f02cd3ee' // Replace with the actual user ID
    console.log(`\n2. Fetching user profile for ID: ${userId}`)
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError)
      return
    }
    
    console.log('Current profile data:')
    console.log(JSON.stringify(profile, null, 2))
    
    // 3. Update the user's plan to 'pro'
    console.log('\n3. Updating user plan to "pro"...')
    
    const updateData = {
      plan: 'pro',
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
    
    if (updateError) {
      console.error('❌ Error updating user plan:', updateError)
      return
    }
    
    console.log('✅ User plan updated successfully!')
    
    // 4. Verify the update
    console.log('\n4. Verifying update...')
    
    const { data: updatedProfile, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return
    }
    
    console.log('Updated profile data:')
    console.log(JSON.stringify(updatedProfile, null, 2))
    
    // 5. Check if there's a subscription record
    console.log('\n5. Checking subscription record...')
    
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('❌ Error checking subscription:', subError)
    } else if (subscription) {
      console.log('Existing subscription record:')
      console.log(JSON.stringify(subscription, null, 2))
      
      // Update subscription if needed
      if (subscription.status !== 'active' || subscription.plan !== 'pro') {
        console.log('Updating subscription record...')
        
        const { error: subUpdateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            plan: 'pro',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
        
        if (subUpdateError) {
          console.error('❌ Error updating subscription:', subUpdateError)
        } else {
          console.log('✅ Subscription updated successfully!')
        }
      }
    } else {
      console.log('No subscription record found. Creating one...')
      
      const { error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert([{
          user_id: userId,
          status: 'active',
          plan: 'pro',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      
      if (createError) {
        console.error('❌ Error creating subscription:', createError)
      } else {
        console.log('✅ Subscription created successfully!')
      }
    }
    
    console.log('\n✅ All operations completed!')
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

updateProfilePlan() 