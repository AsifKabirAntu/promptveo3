import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hmqanqtadlvtweaoxmuf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtcWFucXRhZGx2dHdlYW94bXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NTEwNTIsImV4cCI6MjA2OTUyNzA1Mn0.qeHjwm-yO9kpbcEwiTuZml-lTSmXY1CNisbaaQSey3M'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testOAuthFlow() {
  console.log('🔍 Testing OAuth flow...')
  
  try {
    // Test 1: Default OAuth URL
    console.log('\n1. Testing default OAuth URL...')
    const { data: defaultData, error: defaultError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (defaultError) {
      console.error('Default OAuth error:', defaultError)
    } else {
      console.log('✅ Default OAuth URL generated')
      console.log('URL:', defaultData.url)
      
      // Parse the URL to extract parameters
      const url = new URL(defaultData.url)
      const state = url.searchParams.get('state')
      
      if (state) {
        try {
          // Decode the JWT state
          const base64Url = state.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))
          
          const stateData = JSON.parse(jsonPayload)
          console.log('🔍 State data:', stateData)
          console.log('🔍 Site URL from state:', stateData.site_url)
          console.log('🔍 Referrer from state:', stateData.referrer)
        } catch (decodeError) {
          console.log('Could not decode state:', decodeError)
        }
      }
    }
    
    // Test 2: Explicit localhost redirect
    console.log('\n2. Testing explicit localhost redirect...')
    const { data: explicitData, error: explicitError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          prompt: 'select_account'
        }
      }
    })
    
    if (explicitError) {
      console.error('Explicit OAuth error:', explicitError)
    } else {
      console.log('✅ Explicit OAuth URL generated')
      console.log('URL:', explicitData.url)
      
      // Parse the URL to extract parameters
      const url = new URL(explicitData.url)
      const state = url.searchParams.get('state')
      
      if (state) {
        try {
          // Decode the JWT state
          const base64Url = state.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
          }).join(''))
          
          const stateData = JSON.parse(jsonPayload)
          console.log('🔍 State data:', stateData)
          console.log('🔍 Site URL from state:', stateData.site_url)
          console.log('🔍 Referrer from state:', stateData.referrer)
        } catch (decodeError) {
          console.log('Could not decode state:', decodeError)
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testOAuthFlow() 