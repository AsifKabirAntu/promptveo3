import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testMiddleware() {
  console.log('=== Testing Middleware Behavior ===\n')
  
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
    }
  }
  
  // Step 2: Test auth routes with different scenarios
  console.log('\n2. Testing Auth Routes:')
  
  // Test without cookies
  console.log('\n   Testing /auth/signin without cookies:')
  try {
    const response = await fetch('http://localhost:3000/auth/signin', {
      redirect: 'manual'
    })
    console.log(`   Status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error:', err)
  }
  
  // Test with cookies (if session exists)
  if (session) {
    console.log('\n   Testing /auth/signin with session cookies:')
    try {
      const response = await fetch('http://localhost:3000/auth/signin', {
        redirect: 'manual',
        headers: {
          'Cookie': `sb-hmqanqtadlvtweaoxmuf-auth-token=${session.access_token}`
        }
      })
      console.log(`   Status: ${response.status}`)
      if (response.status === 302) {
        const location = response.headers.get('location')
        console.log(`   Redirect to: ${location}`)
      }
    } catch (err) {
      console.error('   Error:', err)
    }
  }
  
  // Step 3: Test dashboard route
  console.log('\n3. Testing Dashboard Route:')
  try {
    const response = await fetch('http://localhost:3000/dashboard', {
      redirect: 'manual'
    })
    console.log(`   Status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error:', err)
  }
  
  // Step 4: Check for any stored auth data
  console.log('\n4. Checking for Stored Auth Data:')
  console.log('   In your browser, check:')
  console.log('   - localStorage.getItem("sb-hmqanqtadlvtweaoxmuf-auth-token")')
  console.log('   - sessionStorage.getItem("sb-hmqanqtadlvtweaoxmuf-auth-token")')
  console.log('   - document.cookie (look for sb-* cookies)')
  
  // Step 5: Test sign-out to clear any stale data
  if (session) {
    console.log('\n5. Testing Sign-Out:')
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('   Sign-out error:', signOutError)
      } else {
        console.log('   ✅ Sign-out successful')
        
        // Test auth route again after sign-out
        const response = await fetch('http://localhost:3000/auth/signin', {
          redirect: 'manual'
        })
        console.log(`   Auth route status after sign-out: ${response.status}`)
      }
    } catch (err) {
      console.error('   Unexpected sign-out error:', err)
    }
  }
  
  console.log('\n=== Middleware Test Complete ===')
  console.log('\nIf sign-in page is redirecting to dashboard:')
  console.log('1. Clear browser storage (localStorage, sessionStorage)')
  console.log('2. Clear browser cookies')
  console.log('3. Try incognito/private browsing mode')
  console.log('4. Check if there are any cached auth tokens')
}

testMiddleware().catch(console.error) 