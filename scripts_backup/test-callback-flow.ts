import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCallbackFlow() {
  console.log('=== Testing Callback Flow ===\n')
  
  // Step 1: Generate OAuth URL
  console.log('1. Generating OAuth URL:')
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
  
  // Step 2: Test callback endpoint with a mock code
  console.log('\n2. Testing callback endpoint:')
  try {
    // Test the callback endpoint without a real code
    const response = await fetch('http://localhost:3000/auth/callback')
    console.log(`   Callback endpoint status: ${response.status}`)
    
    if (response.status === 302) {
      console.log('   ✅ Callback endpoint redirects (expected behavior)')
      const location = response.headers.get('location')
      console.log(`   Redirect location: ${location}`)
    } else if (response.status === 200) {
      console.log('   ⚠️  Callback endpoint returns 200 (may need auth code)')
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`)
    }
  } catch (err) {
    console.error('❌ Error testing callback endpoint:', err)
  }
  
  // Step 3: Test callback with a mock code parameter
  console.log('\n3. Testing callback with mock code:')
  try {
    const mockResponse = await fetch('http://localhost:3000/auth/callback?code=mock_code')
    console.log(`   Mock callback status: ${mockResponse.status}`)
    
    if (mockResponse.status === 302) {
      console.log('   ✅ Mock callback redirects (expected for invalid code)')
      const location = mockResponse.headers.get('location')
      console.log(`   Redirect location: ${location}`)
    }
  } catch (err) {
    console.error('❌ Error testing mock callback:', err)
  }
  
  // Step 4: Check if dashboard is accessible
  console.log('\n4. Testing dashboard accessibility:')
  try {
    const dashboardResponse = await fetch('http://localhost:3000/dashboard')
    console.log(`   Dashboard status: ${dashboardResponse.status}`)
    
    if (dashboardResponse.status === 302) {
      console.log('   ✅ Dashboard redirects to sign-in (expected for unauthenticated user)')
      const location = dashboardResponse.headers.get('location')
      console.log(`   Redirect location: ${location}`)
    } else if (dashboardResponse.status === 200) {
      console.log('   ⚠️  Dashboard accessible without auth (unexpected)')
    }
  } catch (err) {
    console.error('❌ Error testing dashboard:', err)
  }
  
  // Step 5: Test sign-in page accessibility
  console.log('\n5. Testing sign-in page:')
  try {
    const signinResponse = await fetch('http://localhost:3000/auth/signin')
    console.log(`   Sign-in page status: ${signinResponse.status}`)
    
    if (signinResponse.status === 200) {
      console.log('   ✅ Sign-in page accessible')
    } else {
      console.log(`   ⚠️  Sign-in page status: ${signinResponse.status}`)
    }
  } catch (err) {
    console.error('❌ Error testing sign-in page:', err)
  }
  
  console.log('\n=== Test Complete ===')
  console.log('\nTo test the full authentication flow:')
  console.log('1. Open the OAuth URL in a browser:')
  console.log(`   ${oauthData.url}`)
  console.log('2. Complete the Google OAuth flow')
  console.log('3. Check the browser network tab for:')
  console.log('   - OAuth redirect to Google')
  console.log('   - Callback to /auth/callback with code parameter')
  console.log('   - Redirect to /dashboard')
  console.log('4. Check browser console for any errors')
  console.log('5. Verify you can access the dashboard after sign-in')
}

testCallbackFlow().catch(console.error) 