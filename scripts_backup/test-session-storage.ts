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

async function testSessionStorage() {
  console.log('🔍 Testing Supabase session storage...')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    return
  }

  try {
    // Create a client with localStorage persistence
    console.log('\n1. Creating Supabase client with localStorage persistence...')
    const mockLocalStorage: Record<string, string> = {}
    
    // Mock localStorage for Node.js environment
    const localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value },
      removeItem: (key: string) => { delete mockLocalStorage[key] }
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    })
    
    // Create a test session
    console.log('\n2. Creating a mock session...')
    const mockSession = {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'mock_user_id',
        email: 'test@example.com',
        role: 'authenticated'
      }
    }
    
    // Set the session
    console.log('\n3. Setting the session...')
    const { error: setSessionError } = await supabase.auth.setSession(mockSession as any)
    
    if (setSessionError) {
      console.error('❌ Error setting session:', setSessionError)
    } else {
      console.log('✅ Session set successfully')
    }
    
    // Check localStorage
    console.log('\n4. Checking localStorage for session data...')
    const sessionKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
    console.log('Session key:', sessionKey)
    
    if (mockLocalStorage[sessionKey]) {
      console.log('✅ Session found in localStorage')
      
      try {
        const sessionData = JSON.parse(mockLocalStorage[sessionKey])
        console.log('Session data structure:', Object.keys(sessionData))
      } catch (error) {
        console.error('❌ Error parsing session data:', error)
      }
    } else {
      console.error('❌ No session found in localStorage')
    }
    
    // Get the session
    console.log('\n5. Getting the session...')
    const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
    
    if (getSessionError) {
      console.error('❌ Error getting session:', getSessionError)
    } else if (session) {
      console.log('✅ Session retrieved successfully')
      console.log('Session user:', session.user.email)
    } else {
      console.error('❌ No session returned')
    }
    
    // Clear the session
    console.log('\n6. Clearing the session...')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.error('❌ Error signing out:', signOutError)
    } else {
      console.log('✅ Sign out successful')
    }
    
    // Check localStorage again
    console.log('\n7. Checking localStorage after sign out...')
    if (mockLocalStorage[sessionKey]) {
      console.error('❌ Session still exists in localStorage after sign out')
    } else {
      console.log('✅ Session removed from localStorage')
    }
    
    // Test browser storage key format
    console.log('\n8. Verifying browser storage key format...')
    const expectedKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
    console.log('Expected storage key:', expectedKey)
    console.log('This is the key that should be used in the browser localStorage')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testSessionStorage() 