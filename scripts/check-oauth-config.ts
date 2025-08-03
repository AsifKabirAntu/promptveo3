import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOAuthConfig() {
  console.log('=== Checking OAuth Configuration ===\n')
  
  // Step 1: Check environment variables
  console.log('1. Environment Variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  
  // Step 2: Test OAuth providers
  console.log('\n2. Testing OAuth Providers:')
  
  // Test Google OAuth
  console.log('\n   Testing Google OAuth:')
  try {
    const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (googleError) {
      console.error('   ❌ Google OAuth error:', googleError)
      console.log('   This might indicate:')
      console.log('   - Google OAuth not configured in Supabase')
      console.log('   - Missing Google OAuth credentials')
      console.log('   - Incorrect redirect URL')
    } else {
      console.log('   ✅ Google OAuth configured correctly')
      console.log(`   OAuth URL: ${googleData.url}`)
    }
  } catch (err) {
    console.error('   ❌ Unexpected Google OAuth error:', err)
  }
  
  // Step 3: Check Supabase configuration
  console.log('\n3. Supabase Configuration Check:')
  console.log('   Please verify in your Supabase dashboard:')
  console.log('   1. Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]')
  console.log('   2. Navigate to: Authentication > Providers')
  console.log('   3. Check if Google is enabled')
  console.log('   4. Verify these settings:')
  console.log('      - Client ID: [Your Google OAuth Client ID]')
  console.log('      - Client Secret: [Your Google OAuth Client Secret]')
  console.log('      - Redirect URL: http://localhost:3000/auth/callback')
  console.log('      - Authorized redirect URLs: http://localhost:3000/auth/callback')
  
  // Step 4: Check Google OAuth app configuration
  console.log('\n4. Google OAuth App Configuration:')
  console.log('   Please verify in Google Cloud Console:')
  console.log('   1. Go to: https://console.cloud.google.com/')
  console.log('   2. Select your project')
  console.log('   3. Go to: APIs & Services > Credentials')
  console.log('   4. Find your OAuth 2.0 Client ID')
  console.log('   5. Check Authorized redirect URIs include:')
  console.log('      - https://hmqanqtadlvtweaoxmuf.supabase.co/auth/v1/callback')
  console.log('      - http://localhost:3000/auth/callback (for development)')
  
  // Step 5: Test current session
  console.log('\n5. Current Session State:')
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('   ❌ Session error:', sessionError)
  } else {
    console.log(session ? '   ✅ Active session found' : '   ℹ️  No active session')
    if (session) {
      console.log(`   User: ${session.user.email}`)
    }
  }
  
  console.log('\n=== OAuth Configuration Check Complete ===')
  console.log('\nCommon Issues and Solutions:')
  console.log('\n1. If Google OAuth error occurs:')
  console.log('   - Check if Google provider is enabled in Supabase')
  console.log('   - Verify Google OAuth credentials are correct')
  console.log('   - Ensure redirect URLs match exactly')
  
  console.log('\n2. If OAuth works but callback fails:')
  console.log('   - Check server logs for callback errors')
  console.log('   - Verify callback route is working')
  console.log('   - Check if session cookies are being set')
  
  console.log('\n3. If session is not persisted:')
  console.log('   - Check browser storage and cookies')
  console.log('   - Verify auth provider is detecting session')
  console.log('   - Check for JavaScript errors in console')
}

checkOAuthConfig().catch(console.error) 