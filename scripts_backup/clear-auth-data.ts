import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function clearAuthData() {
  console.log('=== Clearing Authentication Data ===\n')
  
  // Step 1: Check current session
  console.log('1. Current Session State:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
  } else {
    console.log(session ? '✅ Active session found' : 'ℹ️  No active session')
    if (session) {
      console.log(`   User: ${session.user.email}`)
    }
  }
  
  // Step 2: Sign out if session exists
  if (session) {
    console.log('\n2. Signing out:')
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('❌ Sign-out error:', signOutError)
      } else {
        console.log('✅ Sign-out successful')
      }
    } catch (err) {
      console.error('❌ Unexpected sign-out error:', err)
    }
  } else {
    console.log('\n2. No session to sign out')
  }
  
  // Step 3: Verify session is cleared
  console.log('\n3. Verifying session is cleared:')
  const { data: { session: clearedSession } } = await supabase.auth.getSession()
  console.log(clearedSession ? '❌ Session still exists' : '✅ Session cleared')
  
  // Step 4: Test auth routes
  console.log('\n4. Testing Auth Routes:')
  try {
    const response = await fetch('http://localhost:3000/auth/signin', {
      redirect: 'manual'
    })
    console.log(`   /auth/signin status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error testing auth route:', err)
  }
  
  try {
    const response = await fetch('http://localhost:3000/dashboard', {
      redirect: 'manual'
    })
    console.log(`   /dashboard status: ${response.status}`)
    if (response.status === 302) {
      const location = response.headers.get('location')
      console.log(`   Redirect to: ${location}`)
    }
  } catch (err) {
    console.error('   Error testing dashboard route:', err)
  }
  
  console.log('\n=== Auth Data Cleared ===')
  console.log('\nNext Steps:')
  console.log('1. Clear browser storage manually:')
  console.log('   - Open browser dev tools (F12)')
  console.log('   - Go to Application/Storage tab')
  console.log('   - Clear localStorage and sessionStorage')
  console.log('   - Clear cookies for localhost:3000')
  console.log('2. Or try incognito/private browsing mode')
  console.log('3. Visit http://localhost:3000/auth/signin')
  console.log('4. Complete the OAuth flow')
  console.log('5. Check if you\'re properly redirected to dashboard')
}

clearAuthData().catch(console.error) 