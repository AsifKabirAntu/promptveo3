import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthState() {
  console.log('Testing authentication state...')
  
  // Check session
  console.log('\n1. Checking session:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('Session error:', sessionError)
  } else {
    console.log('Session exists:', !!session)
    if (session) {
      console.log('Session user ID:', session.user.id)
      console.log('Session user email:', session.user.email)
      console.log('Session expires at:', session.expires_at)
    }
  }
  
  // Check user
  console.log('\n2. Checking user:')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('User error:', userError)
  } else {
    console.log('User exists:', !!user)
    if (user) {
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
    }
  }
  
  // Try to sign in with the known user email
  console.log('\n3. Attempting to sign in with known email:')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3000/dashboard'
    }
  })
  
  if (signInError) {
    console.error('Sign in error:', signInError)
  } else {
    console.log('Sign in initiated:', signInData)
  }
}

testAuthState().catch(console.error) 