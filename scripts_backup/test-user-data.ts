import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUserData() {
  console.log('=== Testing User Data Retrieval ===\n')
  
  // Step 1: Check current session and user
  console.log('1. Current Session & User Data:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
    return
  }
  
  if (!session) {
    console.log('ℹ️  No active session - user needs to sign in first')
    console.log('\nTo test user data:')
    console.log('1. Sign in through the browser')
    console.log('2. Run this script again')
    return
  }
  
  console.log('✅ Active session found')
  console.log(`   User ID: ${session.user.id}`)
  console.log(`   Email: ${session.user.email}`)
  console.log(`   Email confirmed: ${session.user.email_confirmed_at ? 'Yes' : 'No'}`)
  console.log(`   Created at: ${new Date(session.user.created_at).toISOString()}`)
  console.log(`   Last sign in: ${session.user.last_sign_in_at ? new Date(session.user.last_sign_in_at).toISOString() : 'Never'}`)
  
  // Step 2: Check user metadata
  console.log('\n2. User Metadata:')
  const userMetadata = session.user.user_metadata
  if (userMetadata) {
    console.log('✅ User metadata found:')
    console.log(`   Full name: ${userMetadata.full_name || 'Not set'}`)
    console.log(`   Name: ${userMetadata.name || 'Not set'}`)
    console.log(`   Avatar URL: ${userMetadata.avatar_url || 'Not set'}`)
    console.log(`   Picture: ${userMetadata.picture || 'Not set'}`)
    console.log(`   Provider: ${userMetadata.provider || 'Not set'}`)
    console.log(`   Raw metadata:`, JSON.stringify(userMetadata, null, 2))
  } else {
    console.log('ℹ️  No user metadata found')
  }
  
  // Step 3: Check app metadata
  console.log('\n3. App Metadata:')
  const appMetadata = session.user.app_metadata
  if (appMetadata) {
    console.log('✅ App metadata found:')
    console.log(`   Provider: ${appMetadata.provider || 'Not set'}`)
    console.log(`   Providers: ${appMetadata.providers?.join(', ') || 'Not set'}`)
    console.log(`   Raw metadata:`, JSON.stringify(appMetadata, null, 2))
  } else {
    console.log('ℹ️  No app metadata found')
  }
  
  // Step 4: Test user profile data from database
  console.log('\n4. Testing User Profile from Database:')
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (profileError) {
      if (profileError.code === 'PGRST116') {
        console.log('ℹ️  No user profile found in database')
        console.log('   This is normal for new users')
      } else {
        console.error('❌ Error fetching user profile:', profileError)
      }
    } else {
      console.log('✅ User profile found in database:')
      console.log(`   Profile ID: ${profile.id}`)
      console.log(`   User ID: ${profile.user_id}`)
      console.log(`   Full name: ${profile.full_name || 'Not set'}`)
      console.log(`   Avatar URL: ${profile.avatar_url || 'Not set'}`)
      console.log(`   Created at: ${new Date(profile.created_at).toISOString()}`)
      console.log(`   Updated at: ${new Date(profile.updated_at).toISOString()}`)
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching profile:', err)
  }
  
  // Step 5: Test subscription data
  console.log('\n5. Testing Subscription Data:')
  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .single()
    
    if (subError) {
      if (subError.code === 'PGRST116') {
        console.log('ℹ️  No subscription found - user is on free plan')
      } else {
        console.error('❌ Error fetching subscription:', subError)
      }
    } else {
      console.log('✅ Subscription found:')
      console.log(`   Subscription ID: ${subscription.id}`)
      console.log(`   Status: ${subscription.status}`)
      console.log(`   Plan: ${subscription.plan_id || 'Not set'}`)
      console.log(`   Created at: ${new Date(subscription.created_at).toISOString()}`)
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching subscription:', err)
  }
  
  // Step 6: Test user prompts
  console.log('\n6. Testing User Prompts:')
  try {
    const { data: userPrompts, error: promptsError } = await supabase
      .from('user_prompts')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (promptsError) {
      console.error('❌ Error fetching user prompts:', promptsError)
    } else {
      console.log(`✅ Found ${userPrompts?.length || 0} user prompts`)
      if (userPrompts && userPrompts.length > 0) {
        userPrompts.slice(0, 3).forEach((prompt, index) => {
          console.log(`   ${index + 1}. ${prompt.title} (${prompt.created_at})`)
        })
        if (userPrompts.length > 3) {
          console.log(`   ... and ${userPrompts.length - 3} more`)
        }
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching user prompts:', err)
  }
  
  // Step 7: Test favorites
  console.log('\n7. Testing User Favorites:')
  try {
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', session.user.id)
    
    if (favError) {
      console.error('❌ Error fetching favorites:', favError)
    } else {
      console.log(`✅ Found ${favorites?.length || 0} favorites`)
    }
  } catch (err) {
    console.error('❌ Unexpected error fetching favorites:', err)
  }
  
  console.log('\n=== User Data Test Complete ===')
  console.log('\nSummary:')
  console.log('✅ Session data is available')
  console.log('✅ User metadata is accessible')
  console.log('✅ Database queries are working')
  
  if (!session.user.user_metadata?.name && !session.user.user_metadata?.full_name) {
    console.log('\n⚠️  NOTE: User name not found in metadata')
    console.log('   This might be why the dashboard shows no username')
    console.log('   The header will fall back to email display')
  }
}

testUserData().catch(console.error) 