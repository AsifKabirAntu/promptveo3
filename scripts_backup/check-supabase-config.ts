import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = envContent
  .split('\n')
  .filter(line => line.trim() !== '' && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, value] = line.split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkSupabaseConfig() {
  console.log('🔍 Checking Supabase project configuration...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Generate OAuth URL to check site URL configuration
    console.log('\n1. Generating OAuth URL to check site URL configuration...')
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    if (oauthError) {
      console.error('❌ OAuth error:', oauthError)
      return
    }
    
    if (!oauthData?.url) {
      console.error('❌ No OAuth URL generated')
      return
    }
    
    console.log('✅ OAuth URL generated successfully')
    
    // Parse the OAuth URL to extract redirect_to parameter
    const url = new URL(oauthData.url)
    const redirectTo = url.searchParams.get('redirect_to')
    console.log('\n2. Checking redirect_to parameter in OAuth URL...')
    console.log('redirect_to:', redirectTo)
    
    if (redirectTo !== 'http://localhost:3000/auth/callback') {
      console.error('❌ redirect_to parameter does not match expected value')
      console.error('Expected: http://localhost:3000/auth/callback')
      console.error('Actual:', redirectTo)
    } else {
      console.log('✅ redirect_to parameter matches expected value')
    }
    
    // Extract and decode state parameter to check site_url
    const state = url.searchParams.get('state')
    if (state) {
      console.log('\n3. Checking site_url in state parameter...')
      try {
        // Decode the JWT state
        const base64Url = state.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
        
        const stateData = JSON.parse(jsonPayload)
        console.log('site_url from state:', stateData.site_url)
        
        if (stateData.site_url !== 'http://localhost:3000') {
          console.error('❌ site_url is not set to localhost:3000')
          console.error('Please update the Site URL in Supabase dashboard:')
          console.error('1. Go to https://supabase.com/dashboard')
          console.error('2. Select your project')
          console.error('3. Go to Authentication → URL Configuration')
          console.error('4. Change Site URL to: http://localhost:3000')
        } else {
          console.log('✅ site_url is correctly set to localhost:3000')
        }
      } catch (decodeError) {
        console.error('❌ Error decoding state:', decodeError)
      }
    }
    
    // Check redirect URLs configuration
    console.log('\n4. Checking redirect URLs configuration...')
    console.log('Please verify the following settings in your Supabase dashboard:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Authentication → URL Configuration')
    console.log('4. Ensure "Redirect URLs" includes: http://localhost:3000/auth/callback')
    console.log('   If not, add it and save changes')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSupabaseConfig() 