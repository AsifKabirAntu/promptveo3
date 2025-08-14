import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuthFlow() {
  console.log('=== Debugging Authentication Flow ===\n')
  
  // Step 1: Check current session state
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
    }
  }
  
  // Step 2: Check user state
  console.log('\n2. Current User State:')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('❌ User error:', userError)
  } else {
    console.log(user ? '✅ User found' : 'ℹ️  No user')
    if (user) {
      console.log(`   User ID: ${user.id}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
    }
  }
  
  // Step 3: Test OAuth sign-in initiation
  console.log('\n3. Testing OAuth Sign-In Initiation:')
  try {
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
      console.log('✅ OAuth sign-in initiated')
      console.log(`   Provider: ${oauthData.provider}`)
      console.log(`   URL: ${oauthData.url}`)
      console.log('\n   To test the full flow:')
      console.log('   1. Open this URL in a browser:')
      console.log(`      ${oauthData.url}`)
      console.log('   2. Complete the Google OAuth flow')
      console.log('   3. You should be redirected to: http://localhost:3000/auth/callback')
      console.log('   4. Then redirected to: http://localhost:3000/dashboard')
    }
  } catch (err) {
    console.error('❌ Unexpected OAuth error:', err)
  }
  
  // Step 4: Test auth state listener
  console.log('\n4. Setting up Auth State Listener:')
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`   🔄 Auth state change: ${event}`)
    if (session) {
      console.log(`      User: ${session.user.email}`)
      console.log(`      Session expires: ${new Date(session.expires_at! * 1000).toISOString()}`)
    } else {
      console.log('      No session')
    }
  })
  
  // Step 5: Test sign-out if user is signed in
  if (user) {
    console.log('\n5. Testing Sign-Out:')
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      
      if (signOutError) {
        console.error('❌ Sign-out error:', signOutError)
      } else {
        console.log('✅ Sign-out successful')
        
        // Verify session is cleared
        const { data: { session: clearedSession } } = await supabase.auth.getSession()
        console.log(clearedSession ? '❌ Session still exists' : '✅ Session cleared')
      }
    } catch (err) {
      console.error('❌ Unexpected sign-out error:', err)
    }
  } else {
    console.log('\n5. Skipping sign-out test (no user signed in)')
  }
  
  // Step 6: Check environment variables
  console.log('\n6. Environment Variables Check:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  
  // Step 7: Test callback URL accessibility
  console.log('\n7. Testing Callback URL:')
  try {
    const response = await fetch('http://localhost:3000/auth/callback')
    console.log(`   Callback endpoint status: ${response.status}`)
    if (response.status === 200) {
      console.log('   ✅ Callback endpoint accessible')
    } else {
      console.log('   ⚠️  Callback endpoint returned non-200 status')
    }
  } catch (err) {
    console.log('   ❌ Callback endpoint not accessible (server may not be running)')
  }
  
  // Clean up listener
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('\n   Auth state listener cleaned up')
  }, 10000)
  
  console.log('\n=== Debug Complete ===')
  console.log('\nNext steps to verify sign-in:')
  console.log('1. Run the OAuth URL in a browser')
  console.log('2. Complete the Google sign-in flow')
  console.log('3. Check if you\'re redirected to the dashboard')
  console.log('4. Run this script again to verify session state')
}

debugAuthFlow().catch(console.error) 