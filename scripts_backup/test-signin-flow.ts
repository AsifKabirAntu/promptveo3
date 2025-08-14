import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignInFlow() {
  console.log('=== Testing Sign-In Flow ===\n')
  
  // Step 1: Check initial state
  console.log('1. Checking initial authentication state:')
  const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession()
  
  if (initialError) {
    console.error('❌ Error getting initial session:', initialError)
  } else {
    console.log(initialSession ? '✅ User is already signed in' : 'ℹ️  No active session')
    if (initialSession) {
      console.log(`   User ID: ${initialSession.user.id}`)
      console.log(`   Email: ${initialSession.user.email}`)
    }
  }
  
  // Step 2: Test OAuth sign-in initiation
  console.log('\n2. Testing OAuth sign-in initiation:')
  try {
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/dashboard',
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (oauthError) {
      console.error('❌ OAuth sign-in error:', oauthError)
    } else {
      console.log('✅ OAuth sign-in initiated successfully')
      console.log(`   Provider: ${oauthData.provider}`)
      console.log(`   URL: ${oauthData.url}`)
    }
  } catch (err) {
    console.error('❌ Unexpected error during OAuth:', err)
  }
  
  // Step 3: Test email/password sign-in (if you have test credentials)
  console.log('\n3. Testing email/password sign-in:')
  const testEmail = process.env.TEST_EMAIL
  const testPassword = process.env.TEST_PASSWORD
  
  if (testEmail && testPassword) {
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })
      
      if (signInError) {
        console.error('❌ Email/password sign-in error:', signInError.message)
      } else {
        console.log('✅ Email/password sign-in successful')
        console.log(`   User ID: ${signInData.user?.id}`)
        console.log(`   Email: ${signInData.user?.email}`)
        console.log(`   Session created: ${!!signInData.session}`)
        
        // Step 4: Verify session after sign-in
        console.log('\n4. Verifying session after sign-in:')
        const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Error getting session after sign-in:', sessionError)
        } else {
          console.log(newSession ? '✅ Session verified after sign-in' : '❌ No session found after sign-in')
          if (newSession) {
            console.log(`   Session user ID: ${newSession.user.id}`)
            console.log(`   Session expires at: ${new Date(newSession.expires_at! * 1000).toISOString()}`)
          }
        }
        
        // Step 5: Test sign-out
        console.log('\n5. Testing sign-out:')
        const { error: signOutError } = await supabase.auth.signOut()
        
        if (signOutError) {
          console.error('❌ Sign-out error:', signOutError)
        } else {
          console.log('✅ Sign-out successful')
          
          // Verify session is cleared
          const { data: { session: clearedSession } } = await supabase.auth.getSession()
          console.log(clearedSession ? '❌ Session still exists after sign-out' : '✅ Session cleared after sign-out')
        }
      }
    } catch (err) {
      console.error('❌ Unexpected error during email/password sign-in:', err)
    }
  } else {
    console.log('ℹ️  Skipping email/password test - no test credentials provided')
    console.log('   Set TEST_EMAIL and TEST_PASSWORD in .env.local to test this flow')
  }
  
  // Step 6: Test auth state listener
  console.log('\n6. Testing auth state listener:')
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`   Auth state change: ${event}`)
    if (session) {
      console.log(`   Session user: ${session.user.email}`)
    } else {
      console.log('   No session')
    }
  })
  
  // Clean up listener after a short delay
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('   Auth state listener cleaned up')
  }, 5000)
  
  console.log('\n=== Test Complete ===')
  console.log('\nTo test the full flow:')
  console.log('1. Run this script to check OAuth initiation')
  console.log('2. Open the OAuth URL in a browser')
  console.log('3. Complete the OAuth flow')
  console.log('4. Check if you\'re redirected to the dashboard')
}

testSignInFlow().catch(console.error) 