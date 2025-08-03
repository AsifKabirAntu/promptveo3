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

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test 1: Check connection by fetching settings
    console.log('\n1. Testing connection to Supabase...')
    const { data: settings, error: settingsError } = await supabase.from('prompts').select('id').limit(1)
    
    if (settingsError) {
      console.error('❌ Connection error:', settingsError)
    } else {
      console.log('✅ Connection successful')
    }
    
    // Test 2: Try to sign in with Google OAuth (generate URL)
    console.log('\n2. Testing Google OAuth URL generation...')
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    if (oauthError) {
      console.error('❌ OAuth error:', oauthError)
    } else {
      console.log('✅ OAuth URL generated successfully')
      console.log('URL:', oauthData.url)
      console.log('Provider:', oauthData.provider)
    }
    
    // Test 3: Check if site URL is correctly configured
    console.log('\n3. Checking site URL configuration...')
    // Extract state parameter from OAuth URL
    if (oauthData?.url) {
      const url = new URL(oauthData.url)
      const state = url.searchParams.get('state') || ''
      
      if (state) {
        try {
          // Decode the JWT state
          const base64Url = state.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
          
          const stateData = JSON.parse(jsonPayload)
          console.log('✅ State parameter decoded')
          console.log('Site URL from state:', stateData.site_url)
          
          if (stateData.site_url !== 'http://localhost:3000') {
            console.error('❌ Site URL is not set to localhost:3000')
            console.error('Please update the Site URL in Supabase dashboard:')
            console.error('1. Go to https://supabase.com/dashboard')
            console.error('2. Select your project')
            console.error('3. Go to Authentication → URL Configuration')
            console.error('4. Change Site URL to: http://localhost:3000')
          } else {
            console.log('✅ Site URL is correctly set to localhost:3000')
          }
        } catch (decodeError) {
          console.error('❌ Error decoding state:', decodeError)
        }
      }
    } else {
      console.log('❌ No OAuth URL available to check site URL configuration')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSupabaseConnection() 