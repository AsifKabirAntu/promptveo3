import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugOAuthCallback() {
  console.log('=== Debugging OAuth Callback ===\n')
  
  // Step 1: Check environment variables
  console.log('1. Environment Variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  
  // Step 2: Generate OAuth URL
  console.log('\n2. Generating OAuth URL:')
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
    return
  }
  
  console.log('✅ OAuth URL generated:')
  console.log(`   ${oauthData.url}`)
  
  // Step 3: Test callback with different scenarios
  console.log('\n3. Testing Callback Scenarios:')
  
  // Test without code
  console.log('\n   Testing callback without code:')
  try {
    const response = await fetch('http://localhost:3000/auth/callback')
    console.log(`   Status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error:', err)
  }
  
  // Test with invalid code
  console.log('\n   Testing callback with invalid code:')
  try {
    const response = await fetch('http://localhost:3000/auth/callback?code=invalid_code')
    console.log(`   Status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error:', err)
  }
  
  // Test with malformed code
  console.log('\n   Testing callback with malformed code:')
  try {
    const response = await fetch('http://localhost:3000/auth/callback?code=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    console.log(`   Status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error:', err)
  }
  
  // Step 4: Check Supabase OAuth configuration
  console.log('\n4. OAuth Configuration Check:')
  console.log('   In your Supabase dashboard:')
  console.log('   1. Go to Authentication > Providers')
  console.log('   2. Check if Google is enabled')
  console.log('   3. Verify the redirect URL is: http://localhost:3000/auth/callback')
  console.log('   4. Check if Google OAuth app is configured correctly')
  
  // Step 5: Test auth state listener
  console.log('\n5. Setting up Auth State Listener:')
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
  
  // Clean up listener
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('\n   Auth state listener cleaned up')
  }, 10000)
  
  console.log('\n=== OAuth Callback Debug Complete ===')
  console.log('\nNext Steps:')
  console.log('1. Complete the OAuth flow in browser:')
  console.log(`   ${oauthData.url}`)
  console.log('2. Watch for these events:')
  console.log('   - OAuth redirect to Google')
  console.log('   - Google redirects back to callback with code')
  console.log('   - Callback exchanges code for session')
  console.log('   - Redirect to dashboard')
  console.log('3. Check browser console for auth events')
  console.log('4. Check server logs for callback messages')
  console.log('5. If redirected to signin with error, check the error parameter')
  
  console.log(`\nAuth events captured: ${authEvents.join(', ')}`)
}

debugOAuthCallback().catch(console.error) 