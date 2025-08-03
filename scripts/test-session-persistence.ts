import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSessionPersistence() {
  console.log('=== Testing Session Persistence ===\n')
  
  // Step 1: Check current session
  console.log('1. Current Session State:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
  } else {
    console.log(session ? '✅ Active session found' : 'ℹ️  No active session')
    if (session) {
      console.log(`   User ID: ${session.user.id}`)
      console.log(`   Email: ${session.user.email}`)
      console.log(`   Session expires: ${new Date(session.expires_at! * 1000).toISOString()}`)
      console.log(`   Access token: ${session.access_token ? 'Present' : 'Missing'}`)
      console.log(`   Refresh token: ${session.refresh_token ? 'Present' : 'Missing'}`)
    }
  }
  
  // Step 2: Test OAuth flow
  console.log('\n2. Testing OAuth Flow:')
  const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/auth/callback',
      queryParams: {
        prompt: 'select_account'
      }
    }
  })
  
  if (oauthError) {
    console.error('❌ OAuth error:', oauthError)
  } else {
    console.log('✅ OAuth URL generated:')
    console.log(`   ${oauthData.url}`)
  }
  
  // Step 3: Test auth state listener
  console.log('\n3. Setting up Auth State Listener:')
  let authEvents: string[] = []
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    authEvents.push(event)
    console.log(`   🔄 Auth event: ${event}`)
    if (session) {
      console.log(`      User: ${session.user.email}`)
      console.log(`      Token: ${session.access_token ? 'Present' : 'Missing'}`)
    } else {
      console.log('      No session')
    }
  })
  
  // Step 4: Test session refresh
  if (session) {
    console.log('\n4. Testing Session Refresh:')
    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error('❌ Session refresh error:', refreshError)
      } else {
        console.log('✅ Session refreshed successfully')
        console.log(`   New access token: ${refreshData.session?.access_token ? 'Present' : 'Missing'}`)
      }
    } catch (err) {
      console.error('❌ Unexpected refresh error:', err)
    }
  } else {
    console.log('\n4. Skipping session refresh (no session)')
  }
  
  // Step 5: Test user data
  if (session) {
    console.log('\n5. Testing User Data:')
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ User data error:', userError)
      } else if (user) {
        console.log('✅ User data retrieved successfully')
        console.log(`   User ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
      } else {
        console.log('ℹ️  No user data returned')
      }
    } catch (err) {
      console.error('❌ Unexpected user data error:', err)
    }
  } else {
    console.log('\n5. Skipping user data test (no session)')
  }
  
  // Clean up listener
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('\n   Auth state listener cleaned up')
  }, 5000)
  
  console.log('\n=== Session Persistence Test Complete ===')
  console.log('\nDebugging Steps:')
  console.log('1. Complete OAuth flow in browser')
  console.log('2. Check browser console for auth events')
  console.log('3. Check server logs for callback messages')
  console.log('4. Verify session cookies are set')
  console.log('5. Check if auth provider detects session')
  
  console.log(`\nAuth events captured: ${authEvents.join(', ')}`)
  
  if (authEvents.length === 0) {
    console.log('\n⚠️  No auth events captured - this might indicate the issue')
    console.log('   The auth state listener should fire when you complete OAuth')
  }
}

testSessionPersistence().catch(console.error) 