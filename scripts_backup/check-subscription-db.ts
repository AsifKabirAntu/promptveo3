import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSubscriptionDB() {
  console.log('Checking subscription database with admin client...')
  
  // Check all subscriptions
  console.log('\n1. All subscriptions in database:')
  const { data: allSubscriptions, error: allError } = await supabase
    .from('subscriptions')
    .select('*')
  
  if (allError) {
    console.error('Error fetching all subscriptions:', allError)
  } else {
    console.log('Total subscriptions found:', allSubscriptions?.length || 0)
    console.log('Subscriptions:', JSON.stringify(allSubscriptions, null, 2))
  }
  
  // Check for the specific user
  const userId = '5a816845-f381-4c25-8e80-d50e463ca790'
  console.log(`\n2. Subscriptions for user ${userId}:`)
  const { data: userSubscriptions, error: userError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
  
  if (userError) {
    console.error('Error fetching user subscriptions:', userError)
  } else {
    console.log('User subscriptions found:', userSubscriptions?.length || 0)
    console.log('User subscriptions:', JSON.stringify(userSubscriptions, null, 2))
  }
  
  // Check profiles table
  console.log(`\n3. Profile for user 5a816845-f381-4c25-8e80-d50e463ca790:`)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '5a816845-f381-4c25-8e80-d50e463ca790')
    .single()

  if (profileError) {
    console.log('Error fetching profile:', profileError)
  } else {
    console.log('Profile found:', profile)
  }

  console.log('\n4. All users in profiles table:')
  const { data: allProfiles, error: allProfilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(10)

  if (allProfilesError) {
    console.log('Error fetching all profiles:', allProfilesError)
  } else {
    console.log('Total profiles found:', allProfiles?.length || 0)
    console.log('Profiles:', allProfiles)
  }

  console.log('\n5. All users in profiles table:')
  const { data: allUserProfiles, error: allUserProfilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(10)

  if (allUserProfilesError) {
    console.log('Error fetching all profiles:', allUserProfilesError)
  } else {
    console.log('Total profiles found:', allUserProfiles?.length || 0)
    console.log('User profiles:', allUserProfiles)
  }
}

checkSubscriptionDB().catch(console.error) 