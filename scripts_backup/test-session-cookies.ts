import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSessionCookies() {
  console.log('=== Testing Session Cookies ===\n')
  
  // Step 1: Check current session
  console.log('1. Current Session State:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
  } else {
    console.log(session ? '✅ Active session found' : 'ℹ️  No active session')
    if (session) {
      console.log(`   User: ${session.user.email}`)
      console.log(`   Access token: ${session.access_token ? 'Present' : 'Missing'}`)
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
  
  // Step 3: Test callback endpoint
  console.log('\n3. Testing Callback Endpoint:')
  try {
    const response = await fetch('http://localhost:3000/auth/callback?code=test_code')
    console.log(`   Callback status: ${response.status}`)
    
    // Check for cookies in response
    const cookies = response.headers.get('set-cookie')
    if (cookies) {
      console.log('   Cookies set:', cookies)
    } else {
      console.log('   No cookies set in response')
    }
    
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error testing callback:', err)
  }
  
  // Step 4: Test dashboard access
  console.log('\n4. Testing Dashboard Access:')
  try {
    const response = await fetch('http://localhost:3000/dashboard', {
      redirect: 'manual'
    })
    console.log(`   Dashboard status: ${response.status}`)
    
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error testing dashboard:', err)
  }
  
  // Step 5: Browser instructions
  console.log('\n5. Browser Cookie Check:')
  console.log('   After completing OAuth in browser, check:')
  console.log('   1. Open browser dev tools (F12)')
  console.log('   2. Go to Application/Storage tab')
  console.log('   3. Check Cookies for localhost:3000')
  console.log('   4. Look for cookies starting with "sb-"')
  console.log('   5. Check localStorage for "sb-hmqanqtadlvtweaoxmuf-auth-token"')
  console.log('   6. Check sessionStorage for "sb-hmqanqtadlvtweaoxmuf-auth-token"')
  
  console.log('\n=== Session Cookie Test Complete ===')
  console.log('\nNext Steps:')
  console.log('1. Complete OAuth flow in browser')
  console.log('2. Check browser cookies and storage')
  console.log('3. Check server logs for callback messages')
  console.log('4. Check if session is detected by auth provider')
}

testSessionCookies().catch(console.error) 